"""Storage for patient retinal images.

Design notes, because this file guards protected health information:

* Images are validated by decoding them, never by trusting the client's
  Content-Type header or filename extension.
* The stored filename is generated server-side. Nothing derived from
  ``UploadFile.filename`` reaches the filesystem or the object key.
* Images are re-encoded to PNG. This is pixel-lossless but drops EXIF, which
  on a clinical image can carry device serial numbers, GPS coordinates, and
  patient identifiers.
* Nothing here returns a public URL. Callers get an opaque storage key and
  must serve bytes through the authenticated route in api/routes/images.py.

Every function here is blocking (the Supabase SDK is synchronous). Call them
from async code via ``starlette.concurrency.run_in_threadpool``.
"""

from __future__ import annotations

import io
import logging
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_PIXELS = 64_000_000  # guards against decompression bombs
CHUNK_SIZE = 64 * 1024

# Formats we are willing to decode. A retinal fundus image is always one of
# these; SVG and friends are excluded because they can carry script.
ALLOWED_FORMATS = {"JPEG", "PNG", "TIFF", "BMP", "WEBP"}

_LOCAL_SCHEME = "file://"
_SUPABASE_SCHEME = "sb://"

_LOCAL_DIR = Path(__file__).resolve().parents[2] / "uploads"

_supabase_client = None


def _get_supabase():
    """Create the Supabase client lazily.

    Built at first use rather than at import time so a missing or malformed
    key degrades to local storage instead of preventing the app from starting.
    """
    global _supabase_client
    if _supabase_client is None:
        from supabase import create_client

        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase_client


def _supabase_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)


def _read_capped(file: UploadFile, limit: int | None = None) -> bytes:
    """Read the upload, refusing anything over the cap.

    Read in chunks so an oversized upload is rejected without first
    materialising all of it in memory.
    """
    cap = limit or MAX_UPLOAD_BYTES
    buffer = io.BytesIO()
    total = 0
    while True:
        chunk = file.file.read(CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > cap:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the {cap // (1024 * 1024)}MB limit.",
            )
        buffer.write(chunk)
    if total == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty.",
        )
    return buffer.getvalue()


def _put(object_name: str, payload: bytes, content_type: str) -> str:
    """Write bytes to the configured backend and return the opaque storage key.

    Shared by clinical images and credential documents so both take exactly the
    same path: private bucket where configured, local disk otherwise, never a
    public URL.
    """
    if _supabase_configured():
        try:
            _get_supabase().storage.from_(settings.SUPABASE_BUCKET).upload(
                path=object_name,
                file=payload,
                file_options={"content-type": content_type},
            )
            return f"{_SUPABASE_SCHEME}{object_name}"
        except Exception as exc:  # noqa: BLE001 - fall back rather than lose the upload
            if settings.is_production:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Storage is unavailable.",
                ) from exc
            # One line, not a traceback: outside production this fallback is an
            # expected path (no Supabase configured locally) and a full stack on
            # every upload buries real errors.
            logger.warning(
                "Supabase upload unavailable (%s); storing locally.",
                type(exc).__name__,
            )

    _LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    (_LOCAL_DIR / object_name).write_bytes(payload)
    return f"{_LOCAL_SCHEME}{object_name}"


def _decode_and_normalise(raw: bytes) -> bytes:
    """Verify the bytes really are an image, then re-encode as clean PNG.

    Returns the PNG bytes. Raises 422 if the payload is not a decodable image
    in an allowed format — which is what rejects an HTML or SVG payload that
    has merely been renamed to .jpg.
    """
    try:
        # verify() consumes the file object, so it needs its own handle and the
        # image must be reopened afterwards to actually read pixels.
        probe = Image.open(io.BytesIO(raw))
        probe.verify()
        detected = probe.format
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File is not a readable image.",
        )

    if detected not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported image format: {detected}. Allowed: JPEG, PNG, TIFF, BMP, WEBP.",
        )

    try:
        image = Image.open(io.BytesIO(raw))
        width, height = image.size
        if width * height > MAX_PIXELS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Image dimensions are implausibly large.",
            )
        # Drops every metadata chunk, EXIF included, by copying pixels into a
        # fresh image. Conversion to RGB also flattens any alpha channel.
        clean = Image.new("RGB", image.size)
        clean.paste(image.convert("RGB"))

        out = io.BytesIO()
        clean.save(out, format="PNG", optimize=True)
        return out.getvalue()
    except HTTPException:
        raise
    except (OSError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image could not be processed.",
        )


def save_image(file: UploadFile) -> tuple[str, bytes]:
    """Validate, sanitise and store an uploaded retinal image.

    Returns ``(storage_key, png_bytes)``. The key is opaque (``sb://<name>`` or
    ``file://<name>``), never a URL; the scheme prefix makes each row
    self-describing, so switching backends later does not orphan existing
    images. The normalised bytes come back too so the caller can run inference
    without a second round trip to storage.
    """
    raw = _read_capped(file)
    png = _decode_and_normalise(raw)

    # Generated server-side. The client's filename is never consulted, which is
    # what closes the path-traversal hole in the previous implementation.
    object_name = f"{uuid.uuid4().hex}.png"
    return _put(object_name, png, "image/png"), png


MAX_DOCUMENT_BYTES = 8 * 1024 * 1024
MAX_DOCUMENTS_PER_REQUEST = 4
_PDF_MAGIC = b"%PDF-"


def save_credential_document(file: UploadFile) -> dict:
    """Store one proof-of-qualification document.

    Accepts an image or a PDF. These are identity papers — a medical licence
    carries a full name, a registration number and often a photograph — so they
    are handled at least as carefully as the retinal images:

    * Images are decoded and re-encoded exactly as clinical images are, which
      strips EXIF (a phone photo of a licence carries GPS by default).
    * PDFs cannot be re-encoded safely without a rendering dependency, so they
      are validated by magic bytes, size-capped, and stored verbatim. The
      admin route serves them as an attachment rather than inline, so a PDF
      carrying embedded JavaScript is never executed in a reviewer's browser.
    * Nothing here returns a public URL.

    Returns a descriptor for the AccessRequest.documents JSON column.
    """
    raw = _read_capped(file, MAX_DOCUMENT_BYTES)
    original_name = (file.filename or "document")[:120]

    if raw.startswith(_PDF_MAGIC):
        payload, extension, content_type = raw, "pdf", "application/pdf"
    else:
        # Not a PDF, so it must be a genuine image or it is rejected.
        payload, extension, content_type = _decode_and_normalise(raw), "png", "image/png"

    object_name = f"{uuid.uuid4().hex}.{extension}"
    key = _put(object_name, payload, content_type)

    return {
        "key": key,
        "filename": original_name,
        "content_type": content_type,
        "size": len(payload),
    }


def load_document(storage_key: str) -> bytes:
    """Bytes for a stored credential document. Caller must be an administrator."""
    return load_image(storage_key)


def load_image(storage_key: str) -> bytes:
    """Fetch the bytes for a stored image.

    The caller is responsible for having already checked that the requesting
    doctor owns the diagnosis this key belongs to.
    """
    if storage_key.startswith(_SUPABASE_SCHEME):
        object_name = storage_key[len(_SUPABASE_SCHEME) :]
        _reject_traversal(object_name)
        try:
            return _get_supabase().storage.from_(settings.SUPABASE_BUCKET).download(object_name)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
            ) from exc

    if storage_key.startswith(_LOCAL_SCHEME):
        object_name = storage_key[len(_LOCAL_SCHEME) :]
        _reject_traversal(object_name)
        path = _LOCAL_DIR / object_name
        if not path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
            )
        return path.read_bytes()

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
    )


def _reject_traversal(object_name: str) -> None:
    """Defence in depth: keys are server-generated, but they arrive from the DB."""
    if not object_name or "/" in object_name or "\\" in object_name or ".." in object_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
        )

"""Clinician access requests.

The platform is restricted to qualified ophthalmologists, so there is no
self-service sign-up. An applicant submits their details with proof of
qualification; an administrator reviews the documents and then creates the
account through the existing Manage Doctors path.

The submission endpoint is the only unauthenticated write in the application
and the only unauthenticated file upload, so it is deliberately the most
tightly bounded: rate limited per IP, a hard cap on file count and size, the
same decode-and-re-encode validation as clinical images, and no response
content that would let it be used to enumerate existing accounts.
"""

import logging
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
    status,
)
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_admin_user
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.access_request import AccessRequest, AccessRequestStatus
from app.models.user import User
from app.schemas.access_request import (
    AccessRequestCreate,
    AccessRequestResponse,
    AccessRequestReview,
    DocumentSummary,
)
from app.services import storage_service
from app.services.audit_service import client_ip, log_action

logger = logging.getLogger(__name__)
router = APIRouter()

SUBMIT_RATE_LIMIT = "3/hour"


def _to_response(req: AccessRequest, reviewer_name: Optional[str] = None) -> dict:
    """Shape a request for the admin UI without leaking storage keys."""
    documents = [
        DocumentSummary(
            filename=doc.get("filename", f"document-{i + 1}"),
            content_type=doc.get("content_type", "application/octet-stream"),
            size=doc.get("size", 0),
            index=i,
        )
        for i, doc in enumerate(req.documents or [])
    ]
    return {
        "id": req.id,
        "full_name": req.full_name,
        "email": req.email,
        "license_number": req.license_number,
        "institution": req.institution,
        "country": req.country,
        "message": req.message,
        "status": req.status,
        "review_note": req.review_note,
        "reviewed_at": req.reviewed_at,
        "created_at": req.created_at,
        "documents": documents,
        "reviewer_name": reviewer_name,
    }


@router.post("/", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(SUBMIT_RATE_LIMIT)
async def submit_access_request(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    license_number: str = Form(...),
    institution: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    message: Optional[str] = Form(None),
    documents: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Public. Submit an application for clinician access."""
    try:
        payload = AccessRequestCreate(
            full_name=full_name,
            email=email,
            license_number=license_number,
            institution=institution,
            country=country,
            message=message,
        )
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors()
        )

    if not documents:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one proof-of-qualification document is required.",
        )
    if len(documents) > storage_service.MAX_DOCUMENTS_PER_REQUEST:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"At most {storage_service.MAX_DOCUMENTS_PER_REQUEST} documents "
                "may be attached."
            ),
        )

    stored = []
    for upload in documents:
        stored.append(
            await run_in_threadpool(storage_service.save_credential_document, upload)
        )

    ip = client_ip(request)
    access_request = AccessRequest(
        full_name=payload.full_name,
        email=str(payload.email).lower(),
        license_number=payload.license_number,
        institution=payload.institution,
        country=payload.country,
        message=payload.message,
        documents=stored,
        status=AccessRequestStatus.pending,
        ip_address=ip,
    )
    db.add(access_request)
    await db.commit()

    await log_action(
        db,
        action="access_request.submit",
        details={"request_id": access_request.id, "documents": len(stored)},
        ip_address=ip,
    )

    # Identical response whether or not this email already has an account or a
    # prior request: a public endpoint must not confirm who is registered.
    return {
        "message": (
            "Your request has been received. An administrator will review your "
            "credentials and contact you by email."
        )
    }


@router.get("/", response_model=List[AccessRequestResponse])
async def list_access_requests(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
    status_filter: Optional[AccessRequestStatus] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
):
    query = (
        select(AccessRequest, User.full_name)
        .outerjoin(User, AccessRequest.reviewed_by == User.id)
        .order_by(AccessRequest.created_at.desc())
        .limit(limit)
    )
    if status_filter:
        query = query.where(AccessRequest.status == status_filter)

    rows = (await db.execute(query)).all()
    return [_to_response(req, reviewer_name) for req, reviewer_name in rows]


@router.get("/{request_id}/documents/{index}")
async def get_access_request_document(
    request_id: str,
    index: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
) -> Response:
    """Stream one uploaded credential document. Administrators only.

    Served as an attachment rather than inline: a PDF is stored verbatim, and a
    PDF rendered inline can execute embedded JavaScript in the reviewer's
    browser. Downloading it hands the file to the operating system instead.
    """
    req = await db.get(AccessRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    docs = req.documents or []
    if index < 0 or index >= len(docs):
        raise HTTPException(status_code=404, detail="Document not found")

    doc = docs[index]
    payload = await run_in_threadpool(storage_service.load_document, doc["key"])

    await log_action(
        db,
        action="access_request.document.view",
        user_id=current_admin.id,
        details={"request_id": request_id, "index": index},
    )

    safe_name = "".join(
        c for c in doc.get("filename", "document") if c.isalnum() or c in "._- "
    )[:80] or "document"

    return Response(
        content=payload,
        media_type=doc.get("content_type", "application/octet-stream"),
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.patch("/{request_id}", response_model=AccessRequestResponse)
async def review_access_request(
    request_id: str,
    review: AccessRequestReview,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Record a verification decision.

    This does not create an account. Approving means the credentials were
    checked; the administrator then adds the clinician through Manage Doctors.
    """
    from datetime import datetime, timezone

    req = await db.get(AccessRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = review.status
    req.review_note = review.review_note
    req.reviewed_by = current_admin.id
    req.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(req)

    await log_action(
        db,
        action=f"access_request.{review.status.value}",
        user_id=current_admin.id,
        details={"request_id": request_id, "email": req.email},
        ip_address=client_ip(request),
    )
    return _to_response(req, current_admin.full_name)

"""DR grading model boundary.

=============================================================================
CONTRACT FOR WHOEVER IMPLEMENTS THE REAL GRADING MODEL
=============================================================================

No grading model is connected yet. The platform currently runs `StubBackend`,
which returns random values flagged `is_simulated=True`, and the UI shows a
"not for clinical use" banner wherever those results appear.

To connect a real model you implement ONE class. Nothing else in the codebase
needs to change.

    1. Write a class satisfying the `ModelBackend` protocol below:

           class GradingBackend:
               name = "swin-grading"          # whatever identifies your model
               version = "1.0.0"              # bump when weights change

               def __init__(self) -> None:
                   # Load the checkpoint ONCE here, not per request.
                   ...

               def predict(self, image_png: bytes) -> DiagnosisResult:
                   ...

    2. Register it in `_BACKENDS` at the bottom of this file.
    3. Set MODEL_BACKEND="grading" in backend/.env

INPUT you receive
    `image_png` is the raw bytes of a PNG. It has already been validated,
    decoded, stripped of EXIF, and re-encoded by storage_service, so it is
    always a decodable RGB PNG. Decode it with:
        Image.open(io.BytesIO(image_png)).convert("RGB")
    It is NOT resized, normalised, or colour-corrected. Any preprocessing your
    model needs (resize, CLAHE, Reinhard, ImageNet normalisation) is your
    responsibility inside `predict`.

OUTPUT you must return
    A `DiagnosisResult` with:
      dr_stage   int, 0-4 inclusive, per the ICDR scale (see DR_LABELS)
      dr_label   str, must match DR_LABELS[dr_stage]  (use `label_for()`)
      confidence float in [0.0, 1.0], or None if your model cannot express one
      is_simulated  MUST be False for a real model
      model_name / model_version  free-form provenance strings

    `DiagnosisResult.validated()` enforces these ranges. Call it, or construct
    via `DiagnosisResult.create()` which calls it for you.

THREADING
    `predict` is called from a thread pool, never on the event loop, so it may
    block. It must be safe to call concurrently from multiple threads — if your
    inference is not thread-safe, guard it with a lock inside your class.

FAILURE
    Raise any exception. The route converts it into a clean 503 for the doctor
    rather than leaking a stack trace.
=============================================================================
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Protocol

from app.core.config import settings

# ICDR severity scale. Index is the stage; do not reorder.
DR_LABELS = [
    "No DR",
    "Mild DR",
    "Moderate DR",
    "Severe DR",
    "Proliferative DR",
]


def label_for(stage: int) -> str:
    if not 0 <= stage < len(DR_LABELS):
        raise ValueError(f"dr_stage must be 0-{len(DR_LABELS) - 1}, got {stage}")
    return DR_LABELS[stage]


@dataclass(frozen=True)
class DiagnosisResult:
    dr_stage: int
    dr_label: str
    confidence: float | None
    is_simulated: bool
    model_name: str
    model_version: str

    @classmethod
    def create(
        cls,
        *,
        dr_stage: int,
        confidence: float | None,
        is_simulated: bool,
        model_name: str,
        model_version: str,
    ) -> "DiagnosisResult":
        return cls(
            dr_stage=dr_stage,
            dr_label=label_for(dr_stage),
            confidence=confidence,
            is_simulated=is_simulated,
            model_name=model_name,
            model_version=model_version,
        ).validated()

    def validated(self) -> "DiagnosisResult":
        if not 0 <= self.dr_stage < len(DR_LABELS):
            raise ValueError(f"dr_stage out of range: {self.dr_stage}")
        if self.dr_label != DR_LABELS[self.dr_stage]:
            raise ValueError(
                f"dr_label {self.dr_label!r} does not match stage {self.dr_stage}"
            )
        if self.confidence is not None and not 0.0 <= self.confidence <= 1.0:
            raise ValueError(f"confidence must be in [0,1], got {self.confidence}")
        return self


class ModelBackend(Protocol):
    name: str
    version: str

    def predict(self, image_png: bytes) -> DiagnosisResult: ...


class StubBackend:
    """Placeholder that fabricates a result.

    Exists so the platform is demonstrable end-to-end before a grading model
    is available. Every result it produces is flagged `is_simulated=True`, which
    drives the warning banner in the UI and the watermark on the PDF. It
    deliberately ignores the image entirely.
    """

    name = "stub"
    version = "0.0.0-simulated"

    def predict(self, image_png: bytes) -> DiagnosisResult:
        stage = random.randint(0, len(DR_LABELS) - 1)
        return DiagnosisResult.create(
            dr_stage=stage,
            confidence=round(random.uniform(0.70, 0.99), 2),
            is_simulated=True,
            model_name=self.name,
            model_version=self.version,
        )


# Add real backends here, e.g. "grading": GradingBackend
_BACKENDS: dict[str, type] = {
    "stub": StubBackend,
}

_instance: ModelBackend | None = None


def get_backend() -> ModelBackend:
    """Return the configured backend, constructing it once.

    Cached because a real backend loads model weights in __init__ and that must
    not happen per request.
    """
    global _instance
    if _instance is None:
        key = settings.MODEL_BACKEND.strip().lower()
        if key not in _BACKENDS:
            raise RuntimeError(
                f"MODEL_BACKEND={key!r} is not registered. "
                f"Available: {sorted(_BACKENDS)}"
            )
        _instance = _BACKENDS[key]()
    return _instance


def backend_info() -> dict:
    """Describes the active backend for the admin AI Model page."""
    backend = get_backend()
    return {
        "key": settings.MODEL_BACKEND,
        "name": backend.name,
        "version": backend.version,
        "is_simulated": isinstance(backend, StubBackend),
    }

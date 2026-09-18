import logging
import math
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_doctor_user
from app.core.database import get_db
from app.models.diagnosis import Diagnosis, EyeEnum
from app.models.patient import Patient
from app.models.user import User
from app.schemas.diagnosis import DiagnosisListItem, DiagnosisResponse, DiagnosisUpdate
from app.services import storage_service
from app.services.audit_service import log_action
from app.services.model_service import get_backend

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/run", response_model=DiagnosisResponse, status_code=status.HTTP_201_CREATED)
async def run_diagnosis_endpoint(
    patient_id: str = Form(...),
    # Required for new records even though the column is nullable: a fundus
    # image whose laterality is unrecorded cannot be compared against a prior
    # scan of the same eye, which is the whole basis of tracking progression.
    eye: EyeEnum = Form(...),
    image_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    patient = await db.get(Patient, patient_id)
    if not patient or patient.doctor_id != current_doctor.id or not patient.is_active:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validates, strips EXIF and re-encodes, returning the cleaned bytes so
    # inference needs no second round trip to storage. Raises 4xx on anything
    # that is not a genuine image. Blocking, so it runs off the event loop.
    image_key, image_png = await run_in_threadpool(storage_service.save_image, image_file)

    backend = get_backend()
    try:
        result = await run_in_threadpool(backend.predict, image_png)
    except Exception:
        # The doctor gets a clean message; the traceback stays in the log.
        logger.exception("Inference failed for patient %s", patient_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analysis failed. The image was saved; please try again.",
        )

    diagnosis = Diagnosis(
        patient_id=patient_id,
        doctor_id=current_doctor.id,
        eye=eye,
        image_key=image_key,
        dr_stage=result.dr_stage,
        dr_label=result.dr_label,
        confidence=result.confidence,
        is_simulated=result.is_simulated,
        model_name=result.model_name,
        model_version=result.model_version,
    )
    db.add(diagnosis)
    await db.commit()
    await db.refresh(diagnosis)

    await log_action(
        db,
        user_id=current_doctor.id,
        action="diagnosis.run",
        details={
            "diagnosis_id": diagnosis.id,
            "patient_id": patient_id,
            "model": result.model_name,
            "is_simulated": result.is_simulated,
        },
    )
    return await _with_patient(db, diagnosis)


@router.get("/", response_model=dict)
async def list_diagnoses(
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """All diagnoses for the current doctor, newest first.

    Joined to Patient so the name comes back in the same query — this replaces
    the frontend's per-patient request loop.
    """
    base = (
        select(Diagnosis, Patient.full_name)
        .join(Patient, Diagnosis.patient_id == Patient.id)
        .where(Diagnosis.doctor_id == current_doctor.id)
    )

    total = (
        await db.execute(select(func.count()).select_from(base.subquery()))
    ).scalar() or 0

    rows = (
        await db.execute(
            base.order_by(Diagnosis.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
    ).all()

    items = [
        DiagnosisListItem(
            id=diagnosis.id,
            patient_id=diagnosis.patient_id,
            patient_name=patient_name,
            eye=diagnosis.eye,
            dr_stage=diagnosis.dr_stage,
            dr_label=diagnosis.dr_label,
            confidence=diagnosis.confidence,
            is_simulated=diagnosis.is_simulated,
            created_at=diagnosis.created_at,
        ).model_dump()
        for diagnosis, patient_name in rows
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if total else 1,
    }


async def _with_patient(db: AsyncSession, diagnosis: Diagnosis) -> dict:
    """Attach patient identity to a diagnosis payload.

    Every clinical view of a study has to say whose study it is. Returning the
    grade and the eye without a name let the reading page render a result that
    could not be tied to a patient at all, which is how the wrong record gets
    acted on.
    """
    patient = await db.get(Patient, diagnosis.patient_id)
    return {
        **{c.name: getattr(diagnosis, c.name) for c in Diagnosis.__table__.columns},
        "patient_name": patient.full_name if patient else None,
        "patient_date_of_birth": patient.date_of_birth if patient else None,
    }


@router.get("/{id}", response_model=DiagnosisResponse)
async def get_diagnosis(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    diagnosis = await db.get(Diagnosis, id)
    if not diagnosis or diagnosis.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return await _with_patient(db, diagnosis)


@router.patch("/{id}", response_model=DiagnosisResponse)
async def update_diagnosis(
    id: str,
    payload: DiagnosisUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    """Set the clinical notes a doctor writes against a result."""
    diagnosis = await db.get(Diagnosis, id)
    if not diagnosis or diagnosis.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Diagnosis not found")

    # exclude_unset distinguishes "field omitted" from "field explicitly null".
    # Testing `is not None` conflated the two, so clearing notes was impossible:
    # the request returned 200 with the old text still stored, which is the same
    # silent-no-op that made admin password resets appear to succeed.
    changes = payload.model_dump(exclude_unset=True)
    if "notes" in changes:
        diagnosis.notes = changes["notes"]

    await db.commit()
    await db.refresh(diagnosis)
    return await _with_patient(db, diagnosis)


@router.get("/patient/{patient_id}", response_model=List[DiagnosisResponse])
async def get_patient_diagnoses(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    patient = await db.get(Patient, patient_id)
    if not patient or patient.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Patient not found")

    result = await db.execute(
        select(Diagnosis)
        .where(Diagnosis.patient_id == patient_id)
        .order_by(Diagnosis.created_at.desc())
    )
    return result.scalars().all()

import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_doctor_user
from app.core.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.services.audit_service import client_ip, log_action

router = APIRouter()


def _escape_like(term: str) -> str:
    """Neutralise LIKE wildcards in user input.

    Without this, a search for "50%" matches everything after the 5, and "_"
    matches any single character — surprising rather than dangerous, but wrong.
    """
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("/", response_model=dict)
async def read_patients(
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
):
    query = select(Patient).where(
        Patient.doctor_id == current_doctor.id,
        Patient.is_active.is_(True),
    )

    if search and search.strip():
        query = query.where(
            Patient.full_name.ilike(f"%{_escape_like(search.strip())}%", escape="\\")
        )

    total = (
        await db.execute(select(func.count()).select_from(query.subquery()))
    ).scalar() or 0

    rows = (
        await db.execute(
            query.order_by(Patient.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
    ).scalars().all()

    return {
        "items": [PatientResponse.model_validate(p).model_dump() for p in rows],
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if total else 1,
    }


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_in: PatientCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    patient = Patient(**patient_in.model_dump(), doctor_id=current_doctor.id)
    db.add(patient)
    await db.commit()
    await db.refresh(patient)

    await log_action(
        db,
        action="patient.create",
        user_id=current_doctor.id,
        details={"patient_id": patient.id},
        ip_address=client_ip(request),
    )
    return patient


@router.get("/{id}", response_model=PatientResponse)
async def read_patient(
    id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    patient = await db.get(Patient, id)
    if not patient or patient.doctor_id != current_doctor.id or not patient.is_active:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Record-access logging: who opened which patient chart, and when.
    await log_action(
        db,
        action="patient.view",
        user_id=current_doctor.id,
        details={"patient_id": id},
        ip_address=client_ip(request),
    )
    return patient


@router.put("/{id}", response_model=PatientResponse)
async def update_patient(
    id: str,
    patient_in: PatientUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    patient = await db.get(Patient, id)
    if not patient or patient.doctor_id != current_doctor.id or not patient.is_active:
        raise HTTPException(status_code=404, detail="Patient not found")

    for field, value in patient_in.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)

    await log_action(
        db,
        action="patient.update",
        user_id=current_doctor.id,
        details={"patient_id": id},
        ip_address=client_ip(request),
    )
    return patient


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    """Soft delete. The record and its diagnoses are retained; medical records
    should not be destroyed on a UI click."""
    patient = await db.get(Patient, id)
    if not patient or patient.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.is_active = False
    await db.commit()

    await log_action(
        db,
        action="patient.delete",
        user_id=current_doctor.id,
        details={"patient_id": id},
        ip_address=client_ip(request),
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

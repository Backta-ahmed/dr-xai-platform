from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_doctor_user
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
import math

router = APIRouter()

@router.get("/", response_model=dict)
async def read_patients(
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None
):
    """
    Retrieve patients for the current doctor.
    """
    skip = (page - 1) * limit
    
    query = select(Patient).where(Patient.doctor_id == current_doctor.id, Patient.is_active == True)
    
    if search:
        query = query.where(Patient.full_name.ilike(f"%{search}%"))
        
    total_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0
    
    query = query.offset(skip).limit(limit).order_by(Patient.created_at.desc())
    result = await db.execute(query)
    patients = result.scalars().all()
    
    return {
        "items": [PatientResponse.model_validate(p).model_dump() for p in patients],
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if total > 0 else 1
    }

@router.post("/", response_model=PatientResponse)
async def create_patient(
    patient_in: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user)
):
    """
    Create new patient.
    """
    patient = Patient(
        **patient_in.model_dump(),
        doctor_id=current_doctor.id
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient

@router.get("/{id}", response_model=PatientResponse)
async def read_patient(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user)
):
    """
    Get a specific patient by id.
    """
    patient = await db.get(Patient, id)
    if not patient or patient.doctor_id != current_doctor.id or not patient.is_active:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{id}", response_model=PatientResponse)
async def update_patient(
    id: str,
    patient_in: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user)
):
    """
    Update a patient.
    """
    patient = await db.get(Patient, id)
    if not patient or patient.doctor_id != current_doctor.id or not patient.is_active:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
        
    await db.commit()
    await db.refresh(patient)
    return patient

@router.delete("/{id}", response_model=dict)
async def delete_patient(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user)
):
    """
    Soft delete a patient.
    """
    patient = await db.get(Patient, id)
    if not patient or patient.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    patient.is_active = False
    await db.commit()
    return {"message": "Patient deleted successfully"}

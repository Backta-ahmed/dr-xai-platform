from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_doctor_user
from app.models.diagnosis import Diagnosis
from app.models.patient import Patient
from app.models.user import User
from app.schemas.diagnosis import DiagnosisResponse
from app.services.model_service import run_diagnosis
from app.services.xai_service import generate_explanation
from app.services.storage_service import upload_file
import os

router = APIRouter()

@router.post("/run", response_model=DiagnosisResponse)
async def run_diagnosis_endpoint(
    patient_id: str = Form(...),
    image_file: UploadFile = File(...),
    xai_method: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user)
):
    # Verify patient
    patient = await db.get(Patient, patient_id)
    if not patient or patient.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")
        
    # Save image
    image_url = await upload_file(image_file)
    
    # Process AI
    result = run_diagnosis(image_url)
    
    # Process XAI
    xai_path = None
    if xai_method and xai_method.lower() != "none":
        xai_path = generate_explanation(image_url, xai_method, None)
        
    # Create DB record
    diagnosis = Diagnosis(
        patient_id=patient_id,
        doctor_id=current_doctor.id,
        image_url=image_url,
        dr_stage=result["dr_stage"],
        dr_label=result["dr_label"],
        confidence=result["confidence"],
        xai_image_url=xai_path,
        xai_method=xai_method,
    )
    db.add(diagnosis)
    await db.commit()
    await db.refresh(diagnosis)
    
    return diagnosis

@router.get("/{id}", response_model=DiagnosisResponse)
async def get_diagnosis(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user)
):
    diagnosis = await db.get(Diagnosis, id)
    if not diagnosis or diagnosis.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return diagnosis

@router.get("/patient/{patient_id}", response_model=List[DiagnosisResponse])
async def get_patient_diagnoses(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user)
):
    # Verify patient
    patient = await db.get(Patient, patient_id)
    if not patient or patient.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    result = await db.execute(select(Diagnosis).where(Diagnosis.patient_id == patient_id).order_by(Diagnosis.created_at.desc()))
    return result.scalars().all()

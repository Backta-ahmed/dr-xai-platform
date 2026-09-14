from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_doctor_user
from app.models.diagnosis import Diagnosis
from app.models.patient import Patient
from app.models.user import User
from app.services.pdf_service import generate_pdf_report

router = APIRouter()

@router.get("/{diagnosis_id}/pdf")
async def get_diagnosis_pdf(
    diagnosis_id: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user)
):
    diagnosis = await db.get(Diagnosis, diagnosis_id)
    if not diagnosis or diagnosis.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
        
    patient = await db.get(Patient, diagnosis.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    doctor = await db.get(User, diagnosis.doctor_id)

    diag_dict = {
        "id": diagnosis.id,
        "dr_stage": diagnosis.dr_stage,
        "dr_label": diagnosis.dr_label,
        "confidence": diagnosis.confidence,
        "notes": diagnosis.notes
    }
    
    pat_dict = {
        "full_name": patient.full_name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender.value if patient.gender else None,
        "diabetes_type": patient.diabetes_type.value if patient.diabetes_type else None
    }
    
    doc_dict = {
        "full_name": doctor.full_name
    }

    pdf_buffer = generate_pdf_report(diag_dict, pat_dict, doc_dict)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Diagnosis_Report_{diagnosis_id}.pdf"
        }
    )

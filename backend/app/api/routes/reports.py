import re

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_doctor_user
from app.core.database import get_db
from app.models.diagnosis import Diagnosis
from app.models.patient import Patient
from app.models.user import User
from app.services.audit_service import client_ip, log_action
from app.services.pdf_service import generate_pdf_report

router = APIRouter()

_SAFE_FILENAME = re.compile(r"[^A-Za-z0-9_.-]")


@router.get("/{diagnosis_id}/pdf")
async def get_diagnosis_pdf(
    diagnosis_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
):
    diagnosis = await db.get(Diagnosis, diagnosis_id)
    if not diagnosis or diagnosis.doctor_id != current_doctor.id:
        raise HTTPException(status_code=404, detail="Diagnosis not found")

    patient = await db.get(Patient, diagnosis.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = await db.get(User, diagnosis.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Attending doctor not found")

    diag_dict = {
        "id": diagnosis.id,
        "dr_stage": diagnosis.dr_stage,
        "dr_label": diagnosis.dr_label,
        "confidence": diagnosis.confidence,
        "notes": diagnosis.notes,
        # Drives the watermark and the warning banner in the PDF.
        "is_simulated": diagnosis.is_simulated,
        "model_name": diagnosis.model_name,
        "model_version": diagnosis.model_version,
    }
    pat_dict = {
        "full_name": patient.full_name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender.value if patient.gender else None,
        "diabetes_type": patient.diabetes_type.value if patient.diabetes_type else None,
    }
    doc_dict = {"full_name": doctor.full_name}

    # reportlab is CPU-bound and synchronous.
    pdf_buffer = await run_in_threadpool(
        generate_pdf_report, diag_dict, pat_dict, doc_dict
    )

    await log_action(
        db,
        action="report.download",
        user_id=current_doctor.id,
        details={"diagnosis_id": diagnosis_id, "patient_id": diagnosis.patient_id},
        ip_address=client_ip(request),
    )

    safe_id = _SAFE_FILENAME.sub("", diagnosis_id)[:64]
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="DR_Report_{safe_id}.pdf"',
            "Cache-Control": "private, no-store",
        },
    )

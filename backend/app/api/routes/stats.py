"""Per-doctor statistics.

The doctor dashboard previously derived its numbers from a patients-list call
and left three of its four cards hardcoded at zero. This gives it a real
source, mirroring the admin /stats query but scoped to the current doctor.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_doctor_user
from app.core.database import get_db
from app.models.diagnosis import Diagnosis
from app.models.patient import Patient
from app.models.user import User

router = APIRouter()

# Stages 3 and 4 (Severe and Proliferative) are the referral-urgent ones.
SEVERE_STAGE_THRESHOLD = 3


@router.get("/me")
async def get_my_stats(
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
) -> dict:
    doctor_id = current_doctor.id

    total_patients = (
        await db.execute(
            select(func.count())
            .select_from(Patient)
            .where(Patient.doctor_id == doctor_id, Patient.is_active.is_(True))
        )
    ).scalar() or 0

    total_diagnoses = (
        await db.execute(
            select(func.count())
            .select_from(Diagnosis)
            .where(Diagnosis.doctor_id == doctor_id)
        )
    ).scalar() or 0

    severe_cases = (
        await db.execute(
            select(func.count())
            .select_from(Diagnosis)
            .where(
                Diagnosis.doctor_id == doctor_id,
                Diagnosis.dr_stage >= SEVERE_STAGE_THRESHOLD,
            )
        )
    ).scalar() or 0

    since = datetime.now(timezone.utc) - timedelta(days=30)
    this_month = (
        await db.execute(
            select(func.count())
            .select_from(Diagnosis)
            .where(Diagnosis.doctor_id == doctor_id, Diagnosis.created_at >= since)
        )
    ).scalar() or 0

    distribution_rows = (
        await db.execute(
            select(Diagnosis.dr_stage, func.count(Diagnosis.id))
            .where(Diagnosis.doctor_id == doctor_id)
            .group_by(Diagnosis.dr_stage)
            .order_by(Diagnosis.dr_stage)
        )
    ).all()

    simulated_count = (
        await db.execute(
            select(func.count())
            .select_from(Diagnosis)
            .where(
                Diagnosis.doctor_id == doctor_id,
                Diagnosis.is_simulated.is_(True),
            )
        )
    ).scalar() or 0

    return {
        "total_patients": total_patients,
        "total_diagnoses": total_diagnoses,
        "severe_cases": severe_cases,
        "diagnoses_last_30_days": this_month,
        "dr_stage_distribution": [
            {"stage": stage, "count": count} for stage, count in distribution_rows
        ],
        # Lets the dashboard warn when results on screen are not from a real model.
        "simulated_diagnoses": simulated_count,
    }

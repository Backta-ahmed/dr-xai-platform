from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_admin_user
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.diagnosis import Diagnosis
from app.models.patient import Patient
from app.models.system_log import SystemLog
from app.models.user import User, UserRole
from app.schemas.user import UserAdminUpdate, UserCreate, UserResponse
from app.services.audit_service import client_ip, log_action
from app.services.model_service import backend_info

router = APIRouter()


@router.get("/doctors", response_model=List[UserResponse])
async def get_doctors(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    result = await db.execute(
        select(User).where(User.role == UserRole.doctor).order_by(User.created_at.desc())
    )
    return result.scalars().all()


@router.post("/doctors", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    existing = await db.execute(select(User).where(User.email == user_in.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        password=get_password_hash(user_in.password),
        role=UserRole.doctor,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await log_action(
        db,
        action="admin.doctor.create",
        user_id=current_admin.id,
        details={"doctor_id": user.id, "email": user.email},
        ip_address=client_ip(request),
    )
    return user


@router.put("/doctors/{id}", response_model=UserResponse)
async def update_doctor(
    id: str,
    user_in: UserAdminUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """Update a doctor.

    Password changes are applied here. The previous implementation accepted a
    password in the request body, silently ignored it, and returned 200 — so an
    admin resetting a locked-out doctor's password saw success and nothing
    happened.
    """
    user = await db.get(User, id)
    if not user or user.role != UserRole.doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    changed = []
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
        changed.append("full_name")
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
        changed.append("is_active")
    if user_in.password is not None:
        user.password = get_password_hash(user_in.password)
        changed.append("password")

    await db.commit()
    await db.refresh(user)

    await log_action(
        db,
        action="admin.doctor.update",
        user_id=current_admin.id,
        # Records which fields changed, never the password itself.
        details={"doctor_id": id, "fields": changed},
        ip_address=client_ip(request),
    )
    return user


@router.get("/stats")
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    total_doctors = (
        await db.execute(
            select(func.count()).select_from(User).where(User.role == UserRole.doctor)
        )
    ).scalar() or 0

    active_doctors = (
        await db.execute(
            select(func.count())
            .select_from(User)
            .where(User.role == UserRole.doctor, User.is_active.is_(True))
        )
    ).scalar() or 0

    total_patients = (
        await db.execute(
            select(func.count()).select_from(Patient).where(Patient.is_active.is_(True))
        )
    ).scalar() or 0

    total_diagnoses = (
        await db.execute(select(func.count()).select_from(Diagnosis))
    ).scalar() or 0

    simulated = (
        await db.execute(
            select(func.count())
            .select_from(Diagnosis)
            .where(Diagnosis.is_simulated.is_(True))
        )
    ).scalar() or 0

    distribution = (
        await db.execute(
            select(Diagnosis.dr_stage, func.count(Diagnosis.id))
            .group_by(Diagnosis.dr_stage)
            .order_by(Diagnosis.dr_stage)
        )
    ).all()

    return {
        "total_doctors": total_doctors,
        # Previously the "Active Users" card reused total_doctors, so it always
        # displayed the same number as the card beside it.
        "active_doctors": active_doctors,
        "total_patients": total_patients,
        "total_diagnoses": total_diagnoses,
        "simulated_diagnoses": simulated,
        "dr_stage_distribution": [
            {"stage": stage, "count": count} for stage, count in distribution
        ],
    }


@router.get("/model")
async def get_model_status(current_admin: User = Depends(get_current_admin_user)):
    """Backs the admin AI Model page with the real configured backend."""
    return backend_info()


@router.get("/logs")
async def get_system_logs(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
    limit: int = Query(50, ge=1, le=200),
):
    """Recent audit entries, with the acting user's name resolved.

    Left-joined so entries with no user (system actions, failed logins for an
    unknown email) still appear.
    """
    rows = (
        await db.execute(
            select(SystemLog, User.full_name)
            .outerjoin(User, SystemLog.user_id == User.id)
            .order_by(SystemLog.created_at.desc())
            .limit(limit)
        )
    ).all()

    return [
        {
            "id": log.id,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "user_id": log.user_id,
            "user_name": full_name or "System",
        }
        for log, full_name in rows
    ]

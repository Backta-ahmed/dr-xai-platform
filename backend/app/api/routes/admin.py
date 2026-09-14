from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.diagnosis import Diagnosis
from app.models.system_log import SystemLog
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/doctors", response_model=List[UserResponse])
async def get_doctors(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(User).where(User.role == UserRole.doctor))
    return result.scalars().all()

@router.post("/doctors", response_model=UserResponse)
async def create_doctor(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        password=get_password_hash(user_in.password),
        role=UserRole.doctor
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/doctors/{id}", response_model=UserResponse)
async def update_doctor(
    id: str,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    user = await db.get(User, id)
    if not user or user.role != UserRole.doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
        
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/stats")
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    doctors_cnt = await db.execute(select(func.count()).select_from(select(User).where(User.role == UserRole.doctor).subquery()))
    patients_cnt = await db.execute(select(func.count()).select_from(select(Patient).subquery()))
    diag_cnt = await db.execute(select(func.count()).select_from(select(Diagnosis).subquery()))
    
    # distribution
    dist_raw = await db.execute(select(Diagnosis.dr_stage, func.count(Diagnosis.id)).group_by(Diagnosis.dr_stage))
    distribution = [{"stage": row[0], "count": row[1]} for row in dist_raw.all()]
    
    return {
        "total_doctors": doctors_cnt.scalar() or 0,
        "total_patients": patients_cnt.scalar() or 0,
        "total_diagnoses": diag_cnt.scalar() or 0,
        "dr_stage_distribution": distribution
    }

@router.get("/logs")
async def get_system_logs(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
    limit: int = 50
):
    result = await db.execute(select(SystemLog).order_by(SystemLog.created_at.desc()).limit(limit))
    return result.scalars().all()

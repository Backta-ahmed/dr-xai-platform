from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from pydantic import BaseModel
from app.core.security import verify_password, get_password_hash

router = APIRouter()

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

@router.get("/me/profile", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.put("/me/profile", response_model=UserResponse)
async def update_my_profile(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if user_in.full_name:
        current_user.full_name = user_in.full_name
        
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.put("/me/password")
async def update_password(
    pass_in: PasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not verify_password(pass_in.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    current_user.password = get_password_hash(pass_in.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}

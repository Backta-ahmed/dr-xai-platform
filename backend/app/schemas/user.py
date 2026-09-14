from pydantic import BaseModel, EmailStr
from typing import Optional
import datetime
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.doctor

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: str
    role: UserRole
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class UserResponse(UserInDBBase):
    pass

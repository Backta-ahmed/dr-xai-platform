from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.patient import GenderEnum, DiabetesTypeEnum

class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    diabetes_type: Optional[DiabetesTypeEnum] = None
    diabetes_duration_years: Optional[int] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    diabetes_type: Optional[DiabetesTypeEnum] = None
    diabetes_duration_years: Optional[int] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class PatientInDBBase(PatientBase):
    id: str
    doctor_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PatientResponse(PatientInDBBase):
    pass

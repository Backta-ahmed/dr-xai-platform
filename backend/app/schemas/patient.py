from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.patient import DiabetesTypeEnum, GenderEnum

# Matched to the Patient table column widths.
NAME_MAX = 100
PHONE_MAX = 20
NOTES_MAX = 5000

# Oldest verified human lifespan is ~122 years; anything beyond that is a typo.
MAX_AGE_YEARS = 130


class PatientBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=NAME_MAX)
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    diabetes_type: Optional[DiabetesTypeEnum] = None
    diabetes_duration_years: Optional[int] = Field(default=None, ge=0, le=MAX_AGE_YEARS)
    phone: Optional[str] = Field(default=None, max_length=PHONE_MAX)
    notes: Optional[str] = Field(default=None, max_length=NOTES_MAX)

    @field_validator("date_of_birth")
    @classmethod
    def _not_in_future(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return v
        today = date.today()
        if v > today:
            raise ValueError("Date of birth cannot be in the future.")
        if (today - v).days > MAX_AGE_YEARS * 366:
            raise ValueError("Date of birth is implausibly far in the past.")
        return v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    # All optional on update; full_name still cannot be blanked out.
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=NAME_MAX)
    is_active: Optional[bool] = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    doctor_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

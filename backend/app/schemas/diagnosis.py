from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DiagnosisBase(BaseModel):
    dr_stage: int
    dr_label: str
    confidence: Optional[float] = None
    xai_image_url: Optional[str] = None
    xai_method: Optional[str] = None
    notes: Optional[str] = None

class DiagnosisCreate(DiagnosisBase):
    patient_id: str
    image_url: str

class DiagnosisInDBBase(DiagnosisBase):
    id: str
    patient_id: str
    doctor_id: str
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True

class DiagnosisResponse(DiagnosisInDBBase):
    pass

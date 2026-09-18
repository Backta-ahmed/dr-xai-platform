from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.diagnosis import EyeEnum


class DiagnosisUpdate(BaseModel):
    """Only the clinical notes are editable; model output is immutable."""

    notes: Optional[str] = Field(default=None, max_length=5000)


class DiagnosisResponse(BaseModel):
    # protected_namespaces=() because the provenance fields start with "model_",
    # which pydantic otherwise reserves.
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    patient_id: str
    doctor_id: str
    # Every clinical view of a study must identify whose study it is. Optional
    # only so the schema tolerates a deleted patient rather than 500-ing.
    patient_name: Optional[str] = None
    patient_date_of_birth: Optional[date] = None
    eye: Optional[EyeEnum] = None
    dr_stage: int
    dr_label: str
    confidence: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

    # Provenance. The UI keys its "simulated — not for clinical use" banner off
    # is_simulated, so it is required rather than optional.
    is_simulated: bool
    model_name: Optional[str] = None
    model_version: Optional[str] = None

    xai_image_url: Optional[str] = None
    xai_method: Optional[str] = None

    # image_key is deliberately absent: the storage location is internal, and
    # the image is fetched from /api/v1/images/{id}, which checks ownership.


class DiagnosisListItem(BaseModel):
    """Row shape for the reports list, with the patient name joined in."""

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    patient_id: str
    patient_name: str
    eye: Optional[EyeEnum] = None
    dr_stage: int
    dr_label: str
    confidence: Optional[float] = None
    is_simulated: bool
    created_at: datetime

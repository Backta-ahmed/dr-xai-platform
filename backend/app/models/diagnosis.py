import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EyeEnum(str, enum.Enum):
    """Which eye the fundus image is of.

    Standard ophthalmic abbreviations: OD (oculus dexter, right) and OS
    (oculus sinister, left). There is no "both" value — a fundus photograph
    captures one eye, so a diagnosis is always about one eye.
    """

    od = "od"
    os = "os"


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(
        String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    # Opaque storage key ("sb://<name>" or "file://<name>"), never a public URL.
    # Bytes are served only via /api/v1/images/{diagnosis_id}.
    image_key = Column(Text, nullable=False)

    # Nullable at the database layer but required by the API for new records.
    # A fundus image without laterality is clinically incomplete — the same
    # grade means different things in the treated and untreated eye — but rows
    # imported from an external system may genuinely not carry it, and "unknown"
    # is more honest than guessing.
    eye = Column(Enum(EyeEnum, native_enum=False), nullable=True)

    dr_stage = Column(Integer, nullable=False)
    dr_label = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=True)

    # Provenance. is_simulated records whether this row came from a real model
    # or from the stub backend. Not nullable, because once a real grading model
    # is connected, simulated history must stay permanently distinguishable
    # rather than silently blending in with real predictions.
    is_simulated = Column(Boolean, nullable=False, default=True)
    model_name = Column(String(100), nullable=True)
    model_version = Column(String(50), nullable=True)

    # Reserved for the segmentation/XAI work. Left unpopulated while no model is
    # connected, rather than pointing at a placeholder file that does not exist.
    xai_image_url = Column(Text, nullable=True)
    xai_method = Column(String(50), nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow)

    patient = relationship("Patient")
    doctor = relationship("User")

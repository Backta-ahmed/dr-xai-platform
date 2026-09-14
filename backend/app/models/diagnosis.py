import uuid
from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey, Text
from datetime import datetime
from app.core.database import Base
from sqlalchemy.orm import relationship

class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    image_url = Column(Text, nullable=False)
    dr_stage = Column(Integer, nullable=False)
    dr_label = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=True)
    xai_image_url = Column(Text, nullable=True)
    xai_method = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    patient = relationship("Patient")
    doctor = relationship("User")

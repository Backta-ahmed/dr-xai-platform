import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, Enum, Date, ForeignKey, Text, Boolean
from datetime import datetime
from app.core.database import Base
from sqlalchemy.orm import relationship

class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class DiabetesTypeEnum(str, enum.Enum):
    type1 = "type1"
    type2 = "type2"
    gestational = "gestational"
    other = "other"

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Enum(GenderEnum, native_enum=False), nullable=True)
    diabetes_type = Column(Enum(DiabetesTypeEnum, native_enum=False), nullable=True)
    diabetes_duration_years = Column(Integer, nullable=True)
    phone = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True) # Adding soft delete flag as implied by API
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    doctor = relationship("User")

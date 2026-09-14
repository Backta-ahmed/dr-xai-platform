import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from datetime import datetime
from app.core.database import Base
from sqlalchemy.orm import relationship

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(200), nullable=False)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationships
    user = relationship("User")

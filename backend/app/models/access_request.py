import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AccessRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class AccessRequest(Base):
    """An application for clinician access, pending credential review.

    The platform is restricted to qualified ophthalmologists, so accounts are
    never self-served. An applicant submits their details and uploads proof of
    qualification; an administrator reviews the documents and, if satisfied,
    creates the account through the existing Manage Doctors path.

    Approving a request therefore records a verification decision — it does not
    itself grant access. That separation keeps account creation on one audited
    code path and means a mis-click on this screen cannot let anyone in.
    """

    __tablename__ = "access_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    full_name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, index=True)

    # Registration with a national medical council or equivalent. Kept as free
    # text: formats differ by country and validating them is the reviewer's job.
    license_number = Column(String(100), nullable=False)
    institution = Column(String(200), nullable=True)
    country = Column(String(100), nullable=True)
    message = Column(Text, nullable=True)

    # [{ "key": "sb://…", "filename": "licence.pdf",
    #    "content_type": "application/pdf", "size": 182344 }]
    # Storage keys only — the bytes are served solely to administrators through
    # the authenticated document route.
    documents = Column(JSON, nullable=False, default=list)

    status = Column(
        Enum(AccessRequestStatus, native_enum=False),
        nullable=False,
        default=AccessRequestStatus.pending,
        index=True,
    )
    review_note = Column(Text, nullable=True)
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Recorded because this endpoint is public and therefore abusable; it gives
    # an administrator something to act on when a submission is spam.
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, index=True)

    reviewer = relationship("User")

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.access_request import AccessRequestStatus

NAME_MAX = 100
EMAIL_MAX = 150
LICENSE_MAX = 100
INSTITUTION_MAX = 200
MESSAGE_MAX = 2000


class AccessRequestCreate(BaseModel):
    """Submitted from the public request-access form.

    Arrives as multipart form data alongside the uploaded credential files, so
    the route declares these as Form fields rather than binding this model
    directly — it exists to keep the validation rules in one place.
    """

    full_name: str = Field(min_length=2, max_length=NAME_MAX)
    email: EmailStr = Field(max_length=EMAIL_MAX)
    license_number: str = Field(min_length=2, max_length=LICENSE_MAX)
    institution: Optional[str] = Field(default=None, max_length=INSTITUTION_MAX)
    country: Optional[str] = Field(default=None, max_length=NAME_MAX)
    message: Optional[str] = Field(default=None, max_length=MESSAGE_MAX)


class DocumentSummary(BaseModel):
    """Metadata only. The storage key stays server-side."""

    filename: str
    content_type: str
    size: int
    index: int


class AccessRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    license_number: str
    institution: Optional[str] = None
    country: Optional[str] = None
    message: Optional[str] = None
    status: AccessRequestStatus
    review_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    documents: List[DocumentSummary] = []
    reviewer_name: Optional[str] = None


class AccessRequestReview(BaseModel):
    """An administrator's verification decision.

    Deliberately cannot create an account. Approving records that credentials
    were checked; the account is then created through the existing Manage
    Doctors path, so account creation stays on one audited code path.
    """

    status: AccessRequestStatus
    review_note: Optional[str] = Field(default=None, max_length=MESSAGE_MAX)

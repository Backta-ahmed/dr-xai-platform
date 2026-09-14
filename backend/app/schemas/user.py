import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole

# bcrypt silently truncates beyond 72 bytes, so reject longer input rather than
# accept a password whose tail is ignored.
PASSWORD_MIN = 8
PASSWORD_MAX = 72

# Matched to the User table column widths so oversized input is a 422 from
# validation rather than a 500 from the database driver.
NAME_MAX = 100
EMAIL_MAX = 150


class UserBase(BaseModel):
    email: EmailStr = Field(max_length=EMAIL_MAX)
    full_name: str = Field(min_length=1, max_length=NAME_MAX)
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str = Field(min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)
    role: UserRole = UserRole.doctor


class UserAdminUpdate(BaseModel):
    """What an admin may change about a doctor.

    Lists exactly the fields the endpoint actually applies. The previous schema
    also accepted email and password but silently discarded them while still
    returning 200, so a password reset appeared to succeed and did nothing.
    """

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=NAME_MAX)
    is_active: Optional[bool] = None
    password: Optional[str] = Field(
        default=None, min_length=PASSWORD_MIN, max_length=PASSWORD_MAX
    )


class ProfileUpdate(BaseModel):
    """What a user may change about themselves.

    Deliberately excludes role, is_active and email — a user must not be able
    to escalate their own privileges or take over another account's address.
    """

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=NAME_MAX)


class PasswordUpdate(BaseModel):
    old_password: str = Field(min_length=1, max_length=PASSWORD_MAX)
    new_password: str = Field(min_length=PASSWORD_MIN, max_length=PASSWORD_MAX)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: UserRole
    created_at: datetime.datetime
    updated_at: datetime.datetime
    # The password hash is deliberately absent from every response schema.

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import PasswordUpdate, ProfileUpdate, UserResponse
from app.services.audit_service import client_ip, log_action

router = APIRouter()


@router.get("/me/profile", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/me/profile", response_model=UserResponse)
async def update_my_profile(
    user_in: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.put("/me/password")
async def update_password(
    pass_in: PasswordUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Change the current user's password.

    Note: existing tokens stay valid until they expire. Revoking them would
    need a token version column or a denylist; with a 60-minute lifetime the
    exposure window is bounded, and that work belongs with real session
    management rather than here.
    """
    if not verify_password(pass_in.old_password, current_user.password):
        await log_action(
            db,
            action="user.password.change.failure",
            user_id=current_user.id,
            ip_address=client_ip(request),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )

    if pass_in.new_password == pass_in.old_password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must differ from the current one.",
        )

    current_user.password = get_password_hash(pass_in.new_password)
    await db.commit()

    await log_action(
        db,
        action="user.password.change.success",
        user_id=current_user.id,
        ip_address=client_ip(request),
    )
    return {"message": "Password updated successfully"}

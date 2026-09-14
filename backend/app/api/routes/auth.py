from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import LOGIN_RATE_LIMIT, limiter
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserResponse
from app.services.audit_service import client_ip, log_action

router = APIRouter()

# Verified against when no user matches, so a request for an unknown email
# costs the same time as one for a known email. Without this, response timing
# reveals which addresses are registered.
_DUMMY_HASH = security.get_password_hash("timing-equalisation-placeholder")


@router.post("/login", response_model=Token)
@limiter.limit(LOGIN_RATE_LIMIT)
async def login_access_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """Exchange email and password for a bearer token.

    Returns 401 (not 400) on bad credentials so the frontend's 401 interceptor
    triggers, and so the status matches its meaning.
    """
    ip = client_ip(request)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()

    if user is None:
        security.verify_password(form_data.password, _DUMMY_HASH)
        password_ok = False
    else:
        password_ok = security.verify_password(form_data.password, user.password)

    if not user or not password_ok:
        await log_action(
            db,
            action="auth.login.failure",
            user_id=user.id if user else None,
            details={"email": form_data.username},
            ip_address=ip,
        )
        # One message for both cases: never reveal whether the email exists.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        await log_action(
            db,
            action="auth.login.inactive",
            user_id=user.id,
            ip_address=ip,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    await log_action(db, action="auth.login.success", user_id=user.id, ip_address=ip)

    return {
        "access_token": security.create_access_token(
            user.id,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        ),
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Logout is client-side (the token is simply discarded).

    Recorded here so the audit trail shows session ends, not just starts.
    """
    await log_action(
        db,
        action="auth.logout",
        user_id=current_user.id,
        ip_address=client_ip(request),
    )
    return {"message": "Successfully logged out"}

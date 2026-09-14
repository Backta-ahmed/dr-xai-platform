"""Audit trail.

`SystemLog` was defined and read by the admin page but nothing ever wrote to
it, so there was no record of who accessed which patient record. For a system
handling medical data that record is a compliance requirement, not a feature.

Action naming convention is `<domain>.<verb>`, e.g. `auth.login.success`,
`patient.view`, `diagnosis.run`, `admin.doctor.create`.
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.models.system_log import SystemLog

logger = logging.getLogger(__name__)


def client_ip(request: Request) -> str | None:
    """Best-effort client address.

    Honours X-Forwarded-For because the app is expected to sit behind a reverse
    proxy in any real deployment. Only the first hop is taken; the rest of the
    chain is attacker-controllable.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:50]
    return request.client.host[:50] if request.client else None


async def log_action(
    db: AsyncSession,
    *,
    action: str,
    user_id: str | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
) -> None:
    """Record one audited action.

    Deliberately never raises. A failure to write the audit row is logged at
    ERROR but does not abort the doctor's actual operation — losing a log line
    is bad, but failing a diagnosis because logging broke is worse. The ERROR
    is what surfaces the problem.
    """
    try:
        db.add(
            SystemLog(
                user_id=user_id,
                action=action[:200],
                details=details,
                ip_address=ip_address,
            )
        )
        await db.commit()
    except Exception:
        logger.exception("Failed to write audit log for action %s", action)
        try:
            await db.rollback()
        except Exception:
            logger.exception("Audit log rollback also failed")

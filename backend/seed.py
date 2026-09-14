"""Create the initial admin account.

Run once:  python seed.py

The password comes from SEED_ADMIN_PASSWORD in .env and is never printed or
hardcoded. The previous version created admin/admin123 and doctor/doctor123 and
echoed both to the console; those accounts were pushed to a live database.

Doctor accounts are not seeded. An admin creates them through the UI, which
keeps every real account's password chosen by a human rather than by a script.
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.future import select  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import AsyncSessionLocal  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402

MIN_PASSWORD_LENGTH = 12


async def seed() -> int:
    if settings.is_production:
        print(
            "Refusing to seed: ENVIRONMENT is 'production'.\n"
            "Create the first admin manually against the production database."
        )
        return 1

    password = settings.SEED_ADMIN_PASSWORD
    if not password:
        print(
            "SEED_ADMIN_PASSWORD is not set in backend/.env.\n"
            "Set it to a strong password and run this again."
        )
        return 1

    if len(password) < MIN_PASSWORD_LENGTH:
        print(
            f"SEED_ADMIN_PASSWORD is too short "
            f"({len(password)} chars, minimum {MIN_PASSWORD_LENGTH})."
        )
        return 1

    email = settings.SEED_ADMIN_EMAIL.strip().lower()

    # Tables come from `alembic upgrade head`, not create_all, so the schema
    # stays under migration control and matches what production will have.
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalars().first():
            print(f"Admin {email} already exists. Nothing to do.")
            return 0

        db.add(
            User(
                full_name="System Administrator",
                email=email,
                password=get_password_hash(password),
                role=UserRole.admin,
                is_active=True,
            )
        )
        await db.commit()

    print(f"Admin account created: {email}")
    print("Password is the one set in SEED_ADMIN_PASSWORD. It is not shown here.")
    print("Sign in and create doctor accounts from Admin -> Manage Doctors.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(seed()))

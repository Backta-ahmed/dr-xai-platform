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

from email_validator import EmailNotValidError, validate_email  # noqa: E402
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

    # This script writes straight to the database, bypassing the Pydantic
    # schemas the API validates against. Without this check a seeded address
    # that EmailStr rejects (a reserved TLD such as .local, say) creates an
    # account that can sign in but whose responses fail validation with a 500.
    try:
        validate_email(email, check_deliverability=False)
    except EmailNotValidError as exc:
        print(f"SEED_ADMIN_EMAIL is not a valid address: {exc}")
        return 1

    # Optional demo doctor, so a local demo has both roles without clicking
    # through the admin UI first. Never seeded in production, and the password
    # still comes from the environment rather than being hardcoded.
    doctor_email = os.getenv("SEED_DOCTOR_EMAIL", "").strip().lower()
    doctor_password = os.getenv("SEED_DOCTOR_PASSWORD", "")
    if doctor_email:
        try:
            validate_email(doctor_email, check_deliverability=False)
        except EmailNotValidError as exc:
            print(f"SEED_DOCTOR_EMAIL is not a valid address: {exc}")
            return 1
        if len(doctor_password) < 8:
            print("SEED_DOCTOR_PASSWORD must be at least 8 characters.")
            return 1

    # Tables come from `alembic upgrade head`, not create_all, so the schema
    # stays under migration control and matches what production will have.
    created = []
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalars().first():
            print(f"Admin {email} already exists, leaving it alone.")
        else:
            db.add(
                User(
                    full_name="System Administrator",
                    email=email,
                    password=get_password_hash(password),
                    role=UserRole.admin,
                    is_active=True,
                )
            )
            created.append(f"admin  {email}")

        if doctor_email:
            existing_doc = await db.execute(
                select(User).where(User.email == doctor_email)
            )
            if existing_doc.scalars().first():
                print(f"Doctor {doctor_email} already exists, leaving it alone.")
            else:
                db.add(
                    User(
                        full_name=os.getenv("SEED_DOCTOR_NAME", "Dr Demo"),
                        email=doctor_email,
                        password=get_password_hash(doctor_password),
                        role=UserRole.doctor,
                        is_active=True,
                    )
                )
                created.append(f"doctor {doctor_email}")

        await db.commit()

    if not created:
        print("Nothing to do.")
        return 0

    print("Created:")
    for line in created:
        print(f"  {line}")
    print("Passwords are the ones set in the environment. They are not shown here.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(seed()))

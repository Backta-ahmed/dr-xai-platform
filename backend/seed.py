"""
Seed script — creates an admin and a demo doctor user.
Run once:  python seed.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole

async def seed():
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if admin exists
        from sqlalchemy.future import select
        result = await db.execute(select(User).where(User.email == "admin@drplatform.com"))
        if result.scalars().first():
            print("Seed data already exists. Skipping.")
            return

        # Create admin
        admin = User(
            full_name="System Admin",
            email="admin@drplatform.com",
            password=get_password_hash("admin123"),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)

        # Create demo doctor
        doctor = User(
            full_name="Dr. Sarah Ahmed",
            email="doctor@drplatform.com",
            password=get_password_hash("doctor123"),
            role=UserRole.doctor,
            is_active=True,
        )
        db.add(doctor)

        await db.commit()
        print("✅ Seed data created successfully!")
        print("   Admin:  admin@drplatform.com  / admin123")
        print("   Doctor: doctor@drplatform.com / doctor123")

if __name__ == "__main__":
    asyncio.run(seed())

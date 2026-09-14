import asyncio
import sqlite3
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings
from app.models.user import User
from app.models.patient import Patient
from app.models.diagnosis import Diagnosis
from app.models.system_log import SystemLog

# Engines
sqlite_engine = create_async_engine("sqlite+aiosqlite:///./dr_platform.db", connect_args={"check_same_thread": False})
supabase_engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})

async def migrate_table(table_class, name):
    print(f"Migrating {name}...")
    
    async_session_sqlite = sessionmaker(sqlite_engine, class_=AsyncSession, expire_on_commit=False)
    async_session_supabase = sessionmaker(supabase_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_sqlite() as session_sl:
        from sqlalchemy.future import select
        result = await session_sl.execute(select(table_class))
        items = result.scalars().all()
        
        if not items:
            print(f"  - No {name} to migrate.")
            return

        async with async_session_supabase() as session_sb:
            for item in items:
                # Expunge from local session to avoid conflicts when adding to new session
                session_sl.expunge(item)
                # Merge into supabase session
                await session_sb.merge(item)
            
            await session_sb.commit()
            print(f"  Successfully migrated {len(items)} {name}.")

async def main():
    print("Starting Data Migration to Supabase...")
    
    # Order matters due to foreign keys
    try:
        await migrate_table(User, "Users")
        await migrate_table(Patient, "Patients")
        await migrate_table(Diagnosis, "Diagnoses")
        await migrate_table(SystemLog, "SystemLogs")
        print("\nALL DATA MIGRATED SUCCESSFULLY!")
    except Exception as e:
        print(f"\nMigration failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())

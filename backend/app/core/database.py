from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.core.config import settings


def build_connect_args(url: str) -> dict:
    """Driver arguments required by the database behind `url`.

    Exported rather than computed inline because Alembic builds its own engine.
    When it did so without these arguments, migrations against Supabase failed
    intermittently — asyncpg prepares statements by default, and Supabase's
    transaction-mode pooler reuses backend connections between clients, so a
    prepared statement can arrive on a connection that never saw it. The
    failure is intermittent by nature, which made it look like migrations
    worked until one didn't.
    """
    if "sqlite" in url:
        return {"check_same_thread": False}
    if "pooler.supabase.com" in url:
        return {"statement_cache_size": 0}
    return {}


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=build_connect_args(settings.DATABASE_URL),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

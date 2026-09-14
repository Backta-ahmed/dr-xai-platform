from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Configure engine based on database type
# For Supabase Pooler (Transaction mode), we must disable prepared statements
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False
elif "pooler.supabase.com" in settings.DATABASE_URL:
    connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=False,
    connect_args=connect_args
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

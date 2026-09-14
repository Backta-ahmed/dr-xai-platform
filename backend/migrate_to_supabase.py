import sqlite3
import asyncio
from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_local_data(table_name):
    conn = sqlite3.connect("dr_platform.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

async def migrate():
    print("🚀 Starting migration to Supabase...")

    tables = ["users", "patients", "reports", "scans"]
    
    for table in tables:
        print(f"📦 Migrating table: {table}...")
        try:
            data = get_local_data(table)
            if not data:
                print(f"  - No data found in local {table}. Skipping.")
                continue
            
            # Remove SQLAlchemy specific internal state if any (usually not in sqlite dict)
            # Push to Supabase
            for item in data:
                # Handle potential ID conflicts or transformations if needed
                res = supabase.table(table).upsert(item).execute()
                
            print(f"  ✅ Successfully migrated {len(data)} rows to {table}!")
        except Exception as e:
            print(f"  ❌ Error migrating {table}: {e}")
            print("  (This might happen if the table doesn't exist in Supabase yet)")

if __name__ == "__main__":
    asyncio.run(migrate())

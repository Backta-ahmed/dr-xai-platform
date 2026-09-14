import os
import uuid
from fastapi import UploadFile
from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
BUCKET_NAME = "uploads"

async def upload_file(file: UploadFile) -> str:
    """
    Uploads file to Supabase Storage and returns the public URL.
    """
    try:
        file_extension = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        
        # Read file content
        content = await file.read()
        
        # Upload to Supabase
        res = supabase.storage.from_(BUCKET_NAME).upload(
            path=file_name,
            file=content,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)
        
        return public_url
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
        # Fallback to local storage
        print("Falling back to local storage...")
        os.makedirs(BUCKET_NAME, exist_ok=True)
        file_path = os.path.join(BUCKET_NAME, file_name)
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return local URL (assumes server is running on localhost:8000)
        return f"http://localhost:8000/uploads/{file_name}"

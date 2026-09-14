"""Authenticated delivery of patient retinal images.

This route exists to replace the public Supabase URL and the unauthenticated
``/uploads`` StaticFiles mount that previously served these images. Both made
protected health information readable by anyone holding (or guessing) a URL.
"""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.api.deps import get_current_doctor_user
from app.core.database import get_db
from app.models.diagnosis import Diagnosis
from app.models.user import User
from app.services import storage_service

router = APIRouter()


@router.get("/{diagnosis_id}")
async def get_diagnosis_image(
    diagnosis_id: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor_user),
) -> Response:
    """Stream the retinal image belonging to one diagnosis.

    Returns 404 rather than 403 when the diagnosis belongs to another doctor,
    so the response does not confirm that the id exists.
    """
    diagnosis = await db.get(Diagnosis, diagnosis_id)
    if not diagnosis or diagnosis.doctor_id != current_doctor.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
        )

    # Blocking I/O (filesystem or the synchronous Supabase SDK).
    payload = await run_in_threadpool(storage_service.load_image, diagnosis.image_key)

    return Response(
        content=payload,
        media_type="image/png",
        headers={
            # PHI: keep it out of shared caches and off disk.
            "Cache-Control": "private, no-store, max-age=0",
            "X-Content-Type-Options": "nosniff",
        },
    )

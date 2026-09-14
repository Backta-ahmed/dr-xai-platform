"""Local development entry point.

    python run.py

Binds to 127.0.0.1, not 0.0.0.0, so the dev server is not exposed to the
network. Auto-reload is on only outside production — it spawns a file watcher
and restarts on any write, which must never happen on a real deployment.

For production use a proper server instead of this file:

    gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4 -b 127.0.0.1:8000
"""

import os

import uvicorn

from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=not settings.is_production,
    )

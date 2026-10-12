from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os

from app.config import APP_TITLE, APP_VERSION, APP_DESCRIPTION, STATIC_DIR, ROLES_MAP
from app.database import init_db, query_all
from app.seed_data import seed_database
from app.controllers.seatmap_controller import router as seatmap_router, student_router
from app.controllers.attendance_controller import router as attendance_router
from app.controllers.academic_controller import router as academic_router
from app.controllers.ai_report_controller import router as ai_report_router
from app.controllers.communication_worker import router as communication_router, absence_router
from app.controllers.architecture_controller import router as architecture_router

app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description=APP_DESCRIPTION
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize and Seed DB on startup
@app.on_event("startup")
def on_startup():
    init_db()
    seed_database(force=False)

# Register API Routers
app.include_router(architecture_router)
app.include_router(seatmap_router)
app.include_router(student_router)
app.include_router(attendance_router)
app.include_router(academic_router)
app.include_router(ai_report_router)
app.include_router(communication_router)
app.include_router(absence_router)

# Authentication & Role Switcher Helpers
@app.get("/api/auth/users")
def get_auth_users():
    """
    Trả về danh sách tài khoản demo cho 3 vai trò trong sơ đồ
    """
    users = query_all("SELECT * FROM users")
    return {
        "roles": ROLES_MAP,
        "users": users
    }

# Mount static files
if not STATIC_DIR.exists():
    STATIC_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/")
def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse({"status": "API online", "docs": "/docs"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

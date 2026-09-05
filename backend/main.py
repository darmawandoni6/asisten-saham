from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from database import engine, Base
import models
from routers import portfolio, stocks, analysis, recovery, screener, journal, system
from scheduler import start_scheduler

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Asisten Saham API",
    description="Backend API Asisten Saham IDX (EOD Decision Copilot, Screener, Recovery Engine, Portfolio)",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers first
app.include_router(portfolio.router)
app.include_router(stocks.router)
app.include_router(analysis.router)
app.include_router(recovery.router)
app.include_router(screener.router)
app.include_router(journal.router)
app.include_router(system.router)

@app.on_event("startup")
def on_startup():
    try:
        start_scheduler()
    except Exception as e:
        print(f"Scheduler startup warning: {e}")

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}

# Static Frontend mounting (Next.js Static Export)
FRONTEND_OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "out"))

if os.path.exists(FRONTEND_OUT_DIR):
    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_static(full_path: str):
        # Ignore API and docs paths
        if full_path.startswith("api/") or full_path in ("docs", "openapi.json", "redoc"):
            return {"error": "Not Found"}
            
        # 1. Root path
        if not full_path or full_path == "/":
            root_index = os.path.join(FRONTEND_OUT_DIR, "index.html")
            if os.path.isfile(root_index):
                return FileResponse(root_index)

        file_path = os.path.join(FRONTEND_OUT_DIR, full_path)
        
        # 2. Direct file match (_next/..., favicon.ico, images, etc.)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # 3. Directory index (e.g. portfolio/ -> portfolio/index.html)
        dir_index = os.path.join(FRONTEND_OUT_DIR, full_path, "index.html")
        if os.path.isfile(dir_index):
            return FileResponse(dir_index)
            
        # 4. Strip trailing slash if present
        clean_path = full_path.rstrip("/")
        dir_index_clean = os.path.join(FRONTEND_OUT_DIR, clean_path, "index.html")
        if os.path.isfile(dir_index_clean):
            return FileResponse(dir_index_clean)

        # 5. HTML file without extension
        html_file = os.path.join(FRONTEND_OUT_DIR, f"{clean_path}.html")
        if os.path.isfile(html_file):
            return FileResponse(html_file)
            
        # 6. Fallback to 404 or index.html
        not_found = os.path.join(FRONTEND_OUT_DIR, "404.html")
        if os.path.isfile(not_found):
            return FileResponse(not_found, status_code=404)
            
        return FileResponse(os.path.join(FRONTEND_OUT_DIR, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {
            "app": "Asisten Saham API",
            "status": "healthy",
            "docs_url": "/docs"
        }

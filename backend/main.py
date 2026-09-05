from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from database import engine, Base
import models
from routers import portfolio, stocks, analysis, recovery, screener, journal
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

# Include Routers
app.include_router(portfolio.router)
app.include_router(stocks.router)
app.include_router(analysis.router)
app.include_router(recovery.router)
app.include_router(screener.router)
app.include_router(journal.router)

@app.on_event("startup")
def on_startup():
    try:
        start_scheduler()
    except Exception as e:
        print(f"Scheduler startup warning: {e}")

@app.get("/")
def read_root():
    return {
        "app": "Asisten Saham API",
        "status": "healthy",
        "docs_url": "/docs",
        "endpoints": [
            "/api/v1/dashboard",
            "/api/v1/portfolio",
            "/api/v1/stocks/{ticker}/chart",
            "/api/v1/analysis/{ticker}",
            "/api/v1/recovery/{ticker}",
            "/api/v1/screener",
            "/api/v1/journal/trades"
        ]
    }

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}

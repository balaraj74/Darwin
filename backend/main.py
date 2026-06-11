"""
Module: main.py
Description: FastAPI application entry point. Mounts all routers, configures CORS.

Author:  Balaraj
Created: 2026-06-10
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import onboarding, board, execution, twin, auth, profile
from config.env import settings
from utils.logger import get_logger
from services.job_scheduler import start_scheduler, stop_scheduler

logger = get_logger(__name__)

app = FastAPI(
    title="Darwin Agent API",
    description="AI Executive Board — builds startups tailored to the founder, not just the idea.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding.router)
app.include_router(twin.router)
app.include_router(board.router)
app.include_router(execution.router)
app.include_router(auth.router)
app.include_router(profile.router)


from fastapi.responses import RedirectResponse

@app.get("/")
async def root_redirect():
    """Redirect root to API documentation."""
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run and load balancers."""
    return {"status": "healthy", "service": "darwin-agent-api", "version": "1.0.0"}


@app.on_event("startup")
async def startup():
    logger.info(
        "Darwin Agent API starting",
        extra={"env": settings.environment, "gemini_key_set": bool(settings.gemini_api_key)},
    )
    start_scheduler()


@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()
    logger.info("Darwin Agent API stopped")

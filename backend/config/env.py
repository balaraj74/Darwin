"""
Module: env.py
Description: Pydantic Settings — validates all required environment variables at startup.

Author:  Balaraj
Updated: 2026-06-11 — Migrated to Firebase Auth + Firestore (MongoDB + JWT removed)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Google Cloud / Vertex AI (uses Application Default Credentials — no API key)
    gcp_project: str = "darwinagent"
    gcp_location: str = "asia-south1"

    # Firebase project (same as GCP project — ADC handles auth automatically on Cloud Run)
    firebase_project_id: str = "darwinagent"
    firebase_storage_bucket: str = "darwinagent.firebasestorage.app"

    # Legacy Google AI Studio key — kept optional so local .env doesn't break
    gemini_api_key: Optional[str] = None

    # Aerolink Anthropic proxy (primary model)
    aerolink_api_key: Optional[str] = None
    aerolink_base_url: str = "https://capi.aerolink.lat/"

    # NVIDIA Fallbacks
    nvidia_api_key_kimi: Optional[str] = None
    nvidia_api_key: Optional[str] = None
    nvidia_api_key_secondary: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    openrouter_api_key_secondary: Optional[str] = None

    # GitLab (optional — user provides at runtime)
    gitlab_default_token: Optional[str] = None
    gitlab_default_namespace: Optional[str] = None

    # App
    environment: str = "development"
    # Stored as comma-separated string to avoid pydantic-settings JSON parse issues
    allowed_origins_str: str = "http://localhost:3000,http://localhost:3001"

    @property
    def allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins_str.split(",") if o.strip()]


settings = Settings()

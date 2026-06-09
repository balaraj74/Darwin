"""
Module: env.py
Description: Pydantic Settings — validates all required environment variables at startup.

Author:  KAIRON / Founder Twin
Created: 2025-06-09
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Gemini
    gemini_api_key: str

    # NVIDIA Fallbacks
    nvidia_api_key_kimi: Optional[str] = None
    nvidia_api_key: Optional[str] = None
    nvidia_api_key_secondary: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    openrouter_api_key_secondary: Optional[str] = None

    # MongoDB (optional — in-memory fallback used if not set)
    mongodb_uri: Optional[str] = None
    mongodb_db_name: str = "founder_twin"

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

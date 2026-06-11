"""
Module: profile.py
Description: Profile router — get/update user profile, social links, and profile photo.
             Profile photos are stored as base64 in MongoDB (no external storage needed).

Author:  Balaraj
Created: 2026-06-10
"""

from __future__ import annotations

import base64
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Header
from pydantic import BaseModel

from models.user import SocialLinks, UserProfile
from services.mongodb_service import MongoDBService
from services.job_scheduler import run_crawl_job
from utils.auth import decode_access_token
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/profile", tags=["profile"])
db = MongoDBService()

_ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB


# ──────────────────────────────────────────────────────────────────────────────
# Auth helper
# ──────────────────────────────────────────────────────────────────────────────

async def _get_current_user_id(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["sub"]


# ──────────────────────────────────────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None
    portfolio: Optional[str] = None
    twitter: Optional[str] = None
    gitlab_token: Optional[str] = None
    gitlab_namespace: Optional[str] = None


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_photo_b64: Optional[str] = None
    social_links: SocialLinks
    gitlab_token: Optional[str] = None
    gitlab_namespace: Optional[str] = None
    last_crawled_at: Optional[str] = None  # ISO string for JSON friendliness


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=ProfileResponse)
async def get_profile(user_id: str = Depends(_get_current_user_id)) -> ProfileResponse:
    """Fetch the current user's profile and social links."""
    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return ProfileResponse(
        user_id=user.id,
        email=user.email,
        display_name=user.profile.display_name,
        bio=user.profile.bio,
        profile_photo_b64=user.profile.profile_photo_b64,
        social_links=user.profile.social_links,
        gitlab_token=user.profile.gitlab_token,
        gitlab_namespace=user.profile.gitlab_namespace,
        last_crawled_at=user.profile.last_crawled_at.isoformat() if user.profile.last_crawled_at else None,
    )


@router.put("", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    user_id: str = Depends(_get_current_user_id),
) -> ProfileResponse:
    """Update the user's display name, bio, and/or social links."""
    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update mutable fields
    if body.display_name is not None:
        user.profile.display_name = body.display_name
    if body.bio is not None:
        user.profile.bio = body.bio

    # Update social links (only overwrite fields that were supplied)
    links = user.profile.social_links
    if body.github is not None:
        links.github = body.github or None
    if body.linkedin is not None:
        links.linkedin = body.linkedin or None
    if body.instagram is not None:
        links.instagram = body.instagram or None
    if body.portfolio is not None:
        links.portfolio = body.portfolio or None
    if body.twitter is not None:
        links.twitter = body.twitter or None

    if body.gitlab_token is not None:
        user.profile.gitlab_token = body.gitlab_token or None
    if body.gitlab_namespace is not None:
        user.profile.gitlab_namespace = body.gitlab_namespace or None

    await db.save_user(user)
    logger.info("Profile updated", extra={"user_id": user_id})

    return ProfileResponse(
        user_id=user.id,
        email=user.email,
        display_name=user.profile.display_name,
        bio=user.profile.bio,
        profile_photo_b64=user.profile.profile_photo_b64,
        social_links=user.profile.social_links,
        gitlab_token=user.profile.gitlab_token,
        gitlab_namespace=user.profile.gitlab_namespace,
        last_crawled_at=user.profile.last_crawled_at.isoformat() if user.profile.last_crawled_at else None,
    )


@router.post("/photo", response_model=dict)
async def upload_profile_photo(
    file: UploadFile = File(...),
    user_id: str = Depends(_get_current_user_id),
) -> dict:
    """
    Upload and store a profile photo as base64 in MongoDB.
    Max size: 5 MB. Accepted: JPEG, PNG, WebP, GIF.
    """
    if file.content_type not in _ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported image type: {file.content_type}. Use JPEG, PNG, WebP, or GIF.",
        )

    raw = await file.read()
    if len(raw) > _MAX_PHOTO_BYTES:
        raise HTTPException(status_code=413, detail="Photo must be under 5 MB")

    b64 = base64.b64encode(raw).decode("utf-8")
    data_uri = f"data:{file.content_type};base64,{b64}"

    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.profile.profile_photo_b64 = data_uri
    await db.save_user(user)
    logger.info("Profile photo updated", extra={"user_id": user_id, "bytes": len(raw)})

    return {"success": True, "message": "Profile photo updated"}


@router.post("/crawl-now", response_model=dict)
async def trigger_crawl_now(user_id: str = Depends(_get_current_user_id)) -> dict:
    """
    Manually trigger the profile crawler for the current user right now.
    Useful for immediately enriching the twin after saving social links.
    """
    from services.job_scheduler import _enrich_twin_for_user
    await _enrich_twin_for_user(user_id)
    return {"success": True, "message": "Profile crawl triggered. Twin will be updated shortly."}

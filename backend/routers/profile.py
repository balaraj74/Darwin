"""
Module: profile.py
Description: Profile router — get/update user profile, social links, and profile photo.
             Profile photos now stored in Firebase Storage (replaces base64 in DB).

Author:  Balaraj
Updated: 2026-06-11 — Migrated to FirestoreService + Firebase Storage + Firebase Auth
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Header

from pydantic import BaseModel

from models.user import SocialLinks, UserProfile
from services.firestore_service import FirestoreService
from services.storage_service import upload_profile_photo
from services.job_scheduler import run_crawl_job
from utils.auth import verify_firebase_token
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/profile", tags=["profile"])
db = FirestoreService()

_ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5 MB


# ──────────────────────────────────────────────────────────────────────────────
# Auth helper
# ──────────────────────────────────────────────────────────────────────────────

async def _get_current_user_id(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    decoded = await verify_firebase_token(token)
    if not decoded or "uid" not in decoded:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")
    return decoded["uid"]


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
    photo_url: Optional[str] = None           # Firebase Storage URL
    social_links: SocialLinks
    gitlab_token: Optional[str] = None
    gitlab_namespace: Optional[str] = None
    last_crawled_at: Optional[str] = None


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
        photo_url=user.profile.photo_url,
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

    if body.display_name is not None:
        user.profile.display_name = body.display_name
    if body.bio is not None:
        user.profile.bio = body.bio

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
        photo_url=user.profile.photo_url,
        social_links=user.profile.social_links,
        gitlab_token=user.profile.gitlab_token,
        gitlab_namespace=user.profile.gitlab_namespace,
        last_crawled_at=user.profile.last_crawled_at.isoformat() if user.profile.last_crawled_at else None,
    )


@router.post("/photo", response_model=dict)
async def upload_photo(
    file: UploadFile = File(...),
    user_id: str = Depends(_get_current_user_id),
) -> dict:
    """Upload a profile photo to Firebase Storage. Returns the public URL."""
    if file.content_type not in _ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported image type: {file.content_type}. Use JPEG, PNG, WebP, or GIF.",
        )

    raw = await file.read()
    if len(raw) > _MAX_PHOTO_BYTES:
        raise HTTPException(status_code=413, detail="Photo must be under 5 MB")

    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    photo_url = await upload_profile_photo(user_id, raw, file.content_type)
    user.profile.photo_url = photo_url
    await db.save_user(user)
    logger.info("Profile photo updated", extra={"user_id": user_id, "url": photo_url})

    return {"success": True, "photo_url": photo_url}


@router.post("/crawl-now", response_model=dict)
async def trigger_crawl_now(user_id: str = Depends(_get_current_user_id)) -> dict:
    """Manually trigger the profile crawler for the current user right now."""
    from services.job_scheduler import _enrich_twin_for_user
    await _enrich_twin_for_user(user_id)
    return {"success": True, "message": "Profile crawl triggered. Twin will be updated shortly."}

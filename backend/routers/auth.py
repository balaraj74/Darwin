"""
Module: auth.py  (router)
Description: Auth router — verify Firebase ID tokens, upsert user in Firestore.
             The client (frontend) authenticates directly with Firebase and sends
             the resulting ID token here for server-side verification + profile bootstrap.

Author:  Balaraj
Updated: 2026-06-11 — Migrated from custom JWT to Firebase Auth
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header

from models.user import UserInDB, UserProfile, AuthResponse, UserRegisterRequest, UserLoginRequest
from services.firestore_service import FirestoreService
from utils.auth import verify_firebase_token
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
db = FirestoreService()


async def _verify_or_401(authorization: Optional[str]) -> dict:
    """Verify Firebase ID token from Authorization header or raise 401."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    decoded = await verify_firebase_token(token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")
    return decoded


@router.post("/register", response_model=AuthResponse)
async def register(body: UserRegisterRequest) -> AuthResponse:
    """
    Called after the client completes Firebase sign-up (Email/Password or Google).
    Verifies the Firebase ID token, creates the Firestore user document.
    """
    decoded = await verify_firebase_token(body.id_token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token")

    uid: str = decoded["uid"]
    email: str = decoded.get("email", "")
    display_name: str = body.display_name or decoded.get("name") or decoded.get("display_name") or ""
    photo_url: str = decoded.get("picture", "")

    # Check if user already exists (e.g. Google sign-in creates on first call)
    existing = await db.get_user_by_id(uid)
    if existing:
        return AuthResponse(
            user_id=existing.id,
            email=existing.email,
            display_name=existing.profile.display_name,
            photo_url=existing.profile.photo_url,
            is_new_user=False,
        )

    user = UserInDB(
        id=uid,
        email=email,
        created_at=datetime.now(timezone.utc),
        profile=UserProfile(
            display_name=display_name or None,
            photo_url=photo_url or None,
        ),
    )
    await db.save_user(user)
    logger.info("New user registered", extra={"uid": uid, "email": email})

    return AuthResponse(
        user_id=uid,
        email=email,
        display_name=display_name or None,
        photo_url=photo_url or None,
        is_new_user=True,
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: UserLoginRequest) -> AuthResponse:
    """
    Called after the client completes Firebase sign-in.
    Verifies the Firebase ID token, upserts the Firestore user document.
    """
    decoded = await verify_firebase_token(body.id_token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token")

    uid: str = decoded["uid"]
    email: str = decoded.get("email", "")
    display_name: str = decoded.get("name") or decoded.get("display_name") or ""
    photo_url: str = decoded.get("picture", "")

    user = await db.get_user_by_id(uid)
    is_new = False

    if not user:
        # First-time Google sign-in — create Firestore document
        user = UserInDB(
            id=uid,
            email=email,
            created_at=datetime.now(timezone.utc),
            profile=UserProfile(
                display_name=display_name or None,
                photo_url=photo_url or None,
            ),
        )
        await db.save_user(user)
        is_new = True
        logger.info("User auto-created on first login", extra={"uid": uid})
    else:
        # Update photo/name from Firebase if profile doesn't have them yet
        changed = False
        if photo_url and not user.profile.photo_url:
            user.profile.photo_url = photo_url
            changed = True
        if display_name and not user.profile.display_name:
            user.profile.display_name = display_name
            changed = True
        if changed:
            await db.save_user(user)

    return AuthResponse(
        user_id=uid,
        email=user.email,
        display_name=user.profile.display_name,
        photo_url=user.profile.photo_url,
        is_new_user=is_new,
    )


@router.get("/me", response_model=AuthResponse)
async def get_me(authorization: Optional[str] = Header(default=None)) -> AuthResponse:
    """Return the current authenticated user's profile."""
    decoded = await _verify_or_401(authorization)
    uid = decoded["uid"]
    user = await db.get_user_by_id(uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found — please register first")
    return AuthResponse(
        user_id=uid,
        email=user.email,
        display_name=user.profile.display_name,
        photo_url=user.profile.photo_url,
    )

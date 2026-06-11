"""
Module: auth.py  (utils)
Description: Firebase Authentication token verification.
             Replaces custom JWT signing — Firebase handles token creation on the client.

Author:  Balaraj
Updated: 2026-06-11 — Migrated from python-jose JWT to Firebase Admin SDK
"""

from typing import Optional
import asyncio
from utils.logger import get_logger

logger = get_logger(__name__)


def _get_firebase_app():
    """Lazy-initialize the Firebase Admin app (singleton, thread-safe)."""
    import firebase_admin
    from firebase_admin import credentials

    if not firebase_admin._apps:
        # On Cloud Run with ADC, no explicit credentials needed — uses service account automatically.
        # For local dev, set GOOGLE_APPLICATION_CREDENTIALS env var.
        project_id = "darwinagent"
        try:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {"projectId": project_id})
            logger.info("Firebase Admin initialized via Application Default Credentials")
        except Exception as e:
            logger.warning(f"Firebase Admin ADC init failed, trying default: {e}")
            try:
                firebase_admin.initialize_app(options={"projectId": project_id})
            except ValueError:
                pass # Already initialized

    return firebase_admin.get_app()


async def verify_firebase_token(id_token: str) -> Optional[dict]:
    """
    Verify a Firebase ID token and return the decoded claims.

    Args:
        id_token: The Firebase ID token from the client (Authorization: Bearer <token>).

    Returns:
        Decoded token dict with 'uid', 'email', 'name', etc. or None if invalid.
    """
    try:
        from firebase_admin import auth
        _get_firebase_app()
        # firebase_admin.auth.verify_id_token is synchronous — run in thread pool
        decoded = await asyncio.to_thread(auth.verify_id_token, id_token)
        return decoded
    except Exception as e:
        logger.warning("Firebase token verification failed", extra={"error": str(e)})
        return None


async def get_current_user_id(authorization: Optional[str] = None) -> Optional[str]:
    """Extract and verify the Firebase uid from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    decoded = await verify_firebase_token(token)
    return decoded.get("uid") if decoded else None

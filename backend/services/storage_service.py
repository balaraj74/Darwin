"""
Module: storage_service.py
Description: Firebase Storage helpers — upload profile photos, return public URLs.
             Replaces the base64-in-database pattern.

Author:  Balaraj
Created: 2026-06-11
"""

from __future__ import annotations

import asyncio
import uuid
from typing import Optional

from config.env import settings
from utils.logger import get_logger

logger = get_logger(__name__)


async def upload_profile_photo(
    user_id: str,
    raw_bytes: bytes,
    content_type: str,
) -> str:
    """
    Upload a profile photo to Firebase Storage and return the public download URL.

    Args:
        user_id:      Firebase UID — used as the storage path prefix.
        raw_bytes:    Raw image bytes.
        content_type: MIME type (e.g. "image/jpeg").

    Returns:
        Public download URL (with long-lived token).
    """

    def _upload() -> str:
        import firebase_admin
        from firebase_admin import storage, credentials

        if not firebase_admin._apps:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(
                cred,
                {
                    "projectId": settings.firebase_project_id,
                    "storageBucket": settings.firebase_storage_bucket,
                },
            )

        bucket = storage.bucket()
        ext = content_type.split("/")[-1].replace("jpeg", "jpg")
        blob_path = f"profile_photos/{user_id}/{uuid.uuid4().hex}.{ext}"
        blob = bucket.blob(blob_path)
        blob.upload_from_string(raw_bytes, content_type=content_type)
        blob.make_public()
        return blob.public_url

    try:
        url = await asyncio.to_thread(_upload)
        logger.info("Profile photo uploaded", extra={"user_id": user_id, "bytes": len(raw_bytes)})
        return url
    except Exception as e:
        logger.error("Profile photo upload failed", extra={"error": str(e)})
        raise

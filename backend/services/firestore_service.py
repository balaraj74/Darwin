"""
Module: firestore_service.py
Description: Async Firestore persistence for twins, sessions, executions, and users.
             Drop-in replacement for mongodb_service.py — identical public interface.
             Uses Firebase Admin SDK wrapped in asyncio.to_thread for non-blocking I/O.

Author:  Balaraj
Created: 2026-06-11

Dependencies: firebase-admin, config.env, models.*
Exports: FirestoreService
"""

from __future__ import annotations

import asyncio
from typing import Optional
from datetime import datetime

from models.founder import DigitalTwin
from models.board import BoardSession
from models.execution import ExecutionPackage
from models.user import UserInDB
from config.env import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# In-memory fallback (used only if Firestore init fails)
# ---------------------------------------------------------------------------
_twin_store: dict[str, dict] = {}
_session_store: dict[str, dict] = {}
_execution_store: dict[str, dict] = {}
_user_store: dict[str, dict] = {}


def _init_firebase() -> None:
    """Initialize Firebase Admin app once (idempotent)."""
    import firebase_admin
    from firebase_admin import credentials

    if not firebase_admin._apps:
        try:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(
                cred,
                {
                    "projectId": settings.firebase_project_id,
                    "storageBucket": settings.firebase_storage_bucket,
                },
            )
            logger.info("Firebase Admin initialized", extra={"project": settings.firebase_project_id})
        except Exception as e:
            logger.error("Firebase Admin init failed", extra={"error": str(e)})
            raise


def _get_db():
    """Return the Firestore client."""
    _init_firebase()
    from firebase_admin import firestore
    return firestore.client(database_id="default")


class FirestoreService:
    """
    Async persistence layer backed by Cloud Firestore.

    All Firestore operations are synchronous in the Python SDK;
    we wrap them in asyncio.to_thread to keep FastAPI non-blocking.
    """

    def __init__(self) -> None:
        self._use_firestore = True
        try:
            self._db = _get_db()
            logger.info("FirestoreService ready")
        except Exception as e:
            logger.warning(
                "Firestore unavailable — falling back to in-memory store",
                extra={"error": str(e)},
            )
            self._use_firestore = False

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _col(self, name: str):
        return self._db.collection(name)

    async def _run(self, fn, *args, **kwargs):
        """Run a synchronous Firestore call in a thread pool."""
        return await asyncio.to_thread(fn, *args, **kwargs)

    # ------------------------------------------------------------------
    # Twin operations
    # ------------------------------------------------------------------

    async def save_twin(self, twin: DigitalTwin) -> None:
        data = twin.model_dump()
        if self._use_firestore:
            await self._run(
                self._col("twins").document(twin.twin_id).set, data
            )
        else:
            _twin_store[twin.twin_id] = data
        logger.info("Twin saved", extra={"twin_id": twin.twin_id})

    async def get_twin(self, twin_id: str) -> Optional[DigitalTwin]:
        if self._use_firestore:
            doc = await self._run(self._col("twins").document(twin_id).get)
            if not doc.exists:
                return None
            return DigitalTwin(**doc.to_dict())
        data = _twin_store.get(twin_id)
        return DigitalTwin(**data) if data else None

    async def get_twin_by_user(self, user_id: str) -> Optional[DigitalTwin]:
        if self._use_firestore:
            query = self._col("twins").where("user_id", "==", user_id).limit(1)
            docs = await self._run(query.get)
            if not docs:
                return None
            return DigitalTwin(**docs[0].to_dict())
        matches = [DigitalTwin(**d) for d in _twin_store.values() if d.get("user_id") == user_id]
        return matches[-1] if matches else None

    # ------------------------------------------------------------------
    # Session operations
    # ------------------------------------------------------------------

    async def save_session(self, session: BoardSession) -> None:
        data = session.model_dump()
        if self._use_firestore:
            await self._run(
                self._col("board_sessions").document(session.session_id).set, data
            )
        else:
            _session_store[session.session_id] = data
        logger.info("Session saved", extra={"session_id": session.session_id})

    async def get_session(self, session_id: str) -> Optional[BoardSession]:
        if self._use_firestore:
            doc = await self._run(self._col("board_sessions").document(session_id).get)
            if not doc.exists:
                return None
            return BoardSession(**doc.to_dict())
        data = _session_store.get(session_id)
        return BoardSession(**data) if data else None

    async def get_sessions_for_twin(self, twin_id: str) -> list[BoardSession]:
        if self._use_firestore:
            query = self._col("board_sessions").where("twin_id", "==", twin_id)
            docs = await self._run(query.get)
            sessions = []
            for doc in docs:
                try:
                    sessions.append(BoardSession(**doc.to_dict()))
                except Exception:
                    pass
            return sessions
        return [BoardSession(**d) for d in _session_store.values() if d.get("twin_id") == twin_id]

    # ------------------------------------------------------------------
    # Execution package operations
    # ------------------------------------------------------------------

    async def save_execution_package(self, package: ExecutionPackage) -> None:
        data = package.model_dump()
        if self._use_firestore:
            await self._run(
                self._col("executions").document(package.session_id).set, data
            )
        else:
            _execution_store[package.session_id] = data
        logger.info("Execution package saved", extra={"session_id": package.session_id})

    async def get_execution_package(self, session_id: str) -> Optional[ExecutionPackage]:
        if self._use_firestore:
            doc = await self._run(self._col("executions").document(session_id).get)
            if not doc.exists:
                return None
            return ExecutionPackage(**doc.to_dict())
        data = _execution_store.get(session_id)
        return ExecutionPackage(**data) if data else None

    # ------------------------------------------------------------------
    # User operations
    # ------------------------------------------------------------------

    async def save_user(self, user: UserInDB) -> None:
        data = user.model_dump()
        # Serialize datetime fields for Firestore
        data["created_at"] = data["created_at"].isoformat() if isinstance(data.get("created_at"), datetime) else data.get("created_at")
        if data.get("profile", {}).get("last_crawled_at"):
            data["profile"]["last_crawled_at"] = data["profile"]["last_crawled_at"].isoformat() if isinstance(data["profile"]["last_crawled_at"], datetime) else data["profile"]["last_crawled_at"]
        if self._use_firestore:
            await self._run(self._col("users").document(user.id).set, data)
        else:
            _user_store[user.id] = data
        logger.info("User saved", extra={"user_id": user.id, "email": user.email})

    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        if self._use_firestore:
            query = self._col("users").where("email", "==", email).limit(1)
            docs = await self._run(query.get)
            if not docs:
                return None
            return UserInDB(**docs[0].to_dict())
        for u in _user_store.values():
            if u["email"] == email:
                return UserInDB(**u)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        if self._use_firestore:
            doc = await self._run(self._col("users").document(user_id).get)
            if not doc.exists:
                return None
            return UserInDB(**doc.to_dict())
        data = _user_store.get(user_id)
        return UserInDB(**data) if data else None

    async def get_all_users(self) -> list[UserInDB]:
        if self._use_firestore:
            docs = await self._run(self._col("users").get)
            users = []
            for doc in docs:
                try:
                    users.append(UserInDB(**doc.to_dict()))
                except Exception:
                    pass
            return users
        return [UserInDB(**d) for d in _user_store.values()]

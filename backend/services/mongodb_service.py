"""
Module: mongodb_service.py
Description: Async MongoDB persistence for twins, sessions, and execution packages.
             Falls back to in-memory store if MONGODB_URI is not configured.

Author:  Balaraj
Created: 2026-06-10

Dependencies: motor, config.env, models.*
Exports: MongoDBService
"""

from typing import Optional
from models.founder import DigitalTwin
from models.board import BoardSession
from models.execution import ExecutionPackage
from models.user import UserInDB
from config.env import settings
from config.constants import TWINS_COLLECTION, SESSIONS_COLLECTION, EXECUTIONS_COLLECTION
from utils.logger import get_logger
from utils.errors import DatabaseError

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# In-memory fallback stores (used when MONGODB_URI is not set)
# ---------------------------------------------------------------------------
_twin_store: dict[str, dict] = {}
_session_store: dict[str, dict] = {}
_execution_store: dict[str, dict] = {}
_user_store: dict[str, dict] = {}


class MongoDBService:
    """
    Async persistence layer for Darwin Agent.

    Uses MongoDB Atlas when MONGODB_URI is configured.
    Falls back to in-memory dict store for local development / demo.
    """

    def __init__(self) -> None:
        self._use_mongo = bool(settings.mongodb_uri)
        self._db = None

        if self._use_mongo:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                client = AsyncIOMotorClient(settings.mongodb_uri)
                self._db = client[settings.mongodb_db_name]
                logger.info("MongoDB connected", extra={"db": settings.mongodb_db_name})
            except Exception as e:
                logger.warning(
                    "MongoDB connection failed — falling back to in-memory store",
                    extra={"error": str(e)},
                )
                self._use_mongo = False
        else:
            logger.info("No MONGODB_URI — using in-memory store (not production-grade)")

    # ------------------------------------------------------------------
    # Twin operations
    # ------------------------------------------------------------------

    async def save_twin(self, twin: DigitalTwin) -> None:
        """Persist a DigitalTwin."""
        data = twin.model_dump()
        if self._use_mongo:
            await self._db[TWINS_COLLECTION].replace_one(
                {"twin_id": twin.twin_id}, data, upsert=True
            )
        else:
            _twin_store[twin.twin_id] = data
        logger.info("Twin saved", extra={"twin_id": twin.twin_id})

    async def get_twin(self, twin_id: str) -> Optional[DigitalTwin]:
        """Retrieve a DigitalTwin by ID."""
        if self._use_mongo:
            doc = await self._db[TWINS_COLLECTION].find_one({"twin_id": twin_id})
            if not doc:
                return None
            doc.pop("_id", None)
            return DigitalTwin(**doc)
        data = _twin_store.get(twin_id)
        return DigitalTwin(**data) if data else None

    async def get_twin_by_user(self, user_id: str) -> Optional[DigitalTwin]:
        """Retrieve the latest DigitalTwin for a given user ID."""
        if self._use_mongo:
            # Sort by _id descending to get the most recently inserted one if multiple
            doc = await self._db[TWINS_COLLECTION].find_one({"user_id": user_id}, sort=[("_id", -1)])
            if not doc:
                return None
            doc.pop("_id", None)
            return DigitalTwin(**doc)
        
        # In-memory search
        matches = [DigitalTwin(**data) for data in _twin_store.values() if data.get("user_id") == user_id]
        return matches[-1] if matches else None

    # ------------------------------------------------------------------
    # Session operations
    # ------------------------------------------------------------------

    async def save_session(self, session: BoardSession) -> None:
        """Persist a BoardSession."""
        data = session.model_dump()
        if self._use_mongo:
            await self._db[SESSIONS_COLLECTION].replace_one(
                {"session_id": session.session_id}, data, upsert=True
            )
        else:
            _session_store[session.session_id] = data
        logger.info("Session saved", extra={"session_id": session.session_id})

    async def get_session(self, session_id: str) -> Optional[BoardSession]:
        """Retrieve a BoardSession by ID."""
        if self._use_mongo:
            doc = await self._db[SESSIONS_COLLECTION].find_one({"session_id": session_id})
            if not doc:
                return None
            doc.pop("_id", None)
            return BoardSession(**doc)
        data = _session_store.get(session_id)
        return BoardSession(**data) if data else None

    # ------------------------------------------------------------------
    # Execution package operations
    # ------------------------------------------------------------------

    async def save_execution_package(self, package: ExecutionPackage) -> None:
        """Persist an ExecutionPackage."""
        data = package.model_dump()
        if self._use_mongo:
            await self._db[EXECUTIONS_COLLECTION].replace_one(
                {"session_id": package.session_id}, data, upsert=True
            )
        else:
            _execution_store[package.session_id] = data
        logger.info("Execution package saved", extra={"session_id": package.session_id})

    async def get_execution_package(self, session_id: str) -> Optional[ExecutionPackage]:
        """Retrieve an ExecutionPackage by session ID."""
        if self._use_mongo:
            doc = await self._db[EXECUTIONS_COLLECTION].find_one({"session_id": session_id})
            if not doc:
                return None
            doc.pop("_id", None)
            return ExecutionPackage(**doc)
        data = _execution_store.get(session_id)
        return ExecutionPackage(**data) if data else None

    # ------------------------------------------------------------------
    # User operations
    # ------------------------------------------------------------------

    async def save_user(self, user: UserInDB) -> None:
        """Persist a User."""
        data = user.model_dump()
        if self._use_mongo:
            await self._db["users"].replace_one(
                {"id": user.id}, data, upsert=True
            )
        else:
            _user_store[user.id] = data
        logger.info("User saved", extra={"user_id": user.id, "email": user.email})

    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Retrieve a User by Email."""
        if self._use_mongo:
            doc = await self._db["users"].find_one({"email": email})
            if not doc:
                return None
            doc.pop("_id", None)
            return UserInDB(**doc)
        for u in _user_store.values():
            if u["email"] == email:
                return UserInDB(**u)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        """Retrieve a User by ID."""
        if self._use_mongo:
            doc = await self._db["users"].find_one({"id": user_id})
            if not doc:
                return None
            doc.pop("_id", None)
            return UserInDB(**doc)
        data = _user_store.get(user_id)
        return UserInDB(**data) if data else None

    async def get_all_users(self) -> list[UserInDB]:
        """Retrieve all users — used by the cron crawler to iterate profiles."""
        if self._use_mongo:
            cursor = self._db["users"].find({})
            docs = await cursor.to_list(length=None)
            users = []
            for doc in docs:
                doc.pop("_id", None)
                try:
                    users.append(UserInDB(**doc))
                except Exception:
                    pass  # skip malformed docs
            return users
        return [UserInDB(**data) for data in _user_store.values()]

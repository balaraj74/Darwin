"""
Module: onboarding.py
Description: Onboarding router — accepts intake answers, builds and persists DigitalTwin.

Author:  KAIRON / Founder Twin
Created: 2025-06-09
"""

from fastapi import APIRouter, HTTPException
from models.founder import OnboardingIntake, DigitalTwin
from core.digital_twin import build_digital_twin
from services.mongodb_service import MongoDBService
from utils.logger import get_logger
from utils.errors import TwinBuildError

logger = get_logger(__name__)
router = APIRouter(prefix="/onboarding", tags=["onboarding"])
db = MongoDBService()


@router.post("/analyze", response_model=DigitalTwin)
async def analyze_intake(intake: OnboardingIntake) -> DigitalTwin:
    """
    Build and persist a DigitalTwin from founder intake answers.

    Args:
        intake: OnboardingIntake with 7 question answers and startup idea.

    Returns:
        DigitalTwin with inferred profile and hard constraints.

    Raises:
        HTTPException 422: If twin inference fails.
    """
    try:
        twin = await build_digital_twin(intake)
        await db.save_twin(twin)
        logger.info("Twin built and saved", extra={"twin_id": twin.twin_id})
        return twin
    except TwinBuildError as e:
        logger.error("Onboarding failed", extra={"code": e.code, "err_msg": e.message})
        raise HTTPException(status_code=422, detail=str(e))


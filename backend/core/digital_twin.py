"""
Module: digital_twin.py
Description: Infers a structured DigitalTwin from raw onboarding intake answers using Gemini.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: services.gemini_service, models.founder
Exports: build_digital_twin
"""

import json
import uuid
from models.founder import OnboardingIntake, DigitalTwin, FounderProfile, HardConstraints
from services.gemini_service import GeminiService
from utils.logger import get_logger
from utils.errors import TwinBuildError

logger = get_logger(__name__)

TWIN_INFERENCE_PROMPT = """
You are an expert founder analyst. Given raw answers from a startup founder intake form,
infer a precise FounderProfile JSON object.

RAW INTAKE ANSWERS:
{intake_json}

INSTRUCTIONS:
- Extract budget_inr as a clean integer from their capital answer (e.g. "₹50,000" → 50000, "5 lakhs" → 500000, "1.5 million" → 1500000)
- Extract months_to_first_revenue from quit triggers (e.g. "no revenue in 4 months" → 4)
- List technical_skills as specific technologies mentioned (not generic terms)
- blind_spots: 2-4 specific weaknesses revealed by their answers
- competitive_edge: one precise sentence about their genuine unfair advantage

Return ONLY valid JSON — no markdown, no explanation:
{{
  "technical_depth": "low|medium|high",
  "execution_velocity": "slow|medium|fast",
  "risk_tolerance": "low|medium-low|medium|medium-high|high",
  "network_strength": "weak|medium|strong",
  "marketing_aptitude": "low|medium|high",
  "competitive_edge": "one sentence describing the founder's genuine edge",
  "blind_spots": ["list of 2-4 specific blind spots"],
  "quit_triggers": ["extracted from their honest answer"],
  "hard_constraints": {{
    "budget_inr": <integer extracted from capital answer>,
    "months_to_first_revenue": <integer derived from quit triggers>,
    "team_size": 1,
    "technical_skills": ["specific tech skills they mentioned"],
    "no_go_domains": ["domains they explicitly refuse or would be bad at"]
  }}
}}

BE PRECISE. If they said ₹50,000, budget_inr is 50000. If they said 5 lakhs, budget_inr is 500000.
"""


async def build_digital_twin(intake: OnboardingIntake) -> DigitalTwin:
    """
    Infer a structured DigitalTwin from conversational intake answers.

    Args:
        intake: Raw OnboardingIntake answers from the 7-question form.

    Returns:
        DigitalTwin with fully inferred FounderProfile and hard constraints.

    Raises:
        TwinBuildError: If Gemini inference fails or returns malformed JSON.

    Example:
        >>> twin = await build_digital_twin(intake)
        >>> twin.profile.technical_depth
        'high'
    """
    gemini = GeminiService()

    try:
        prompt = TWIN_INFERENCE_PROMPT.format(
            intake_json=intake.model_dump_json(indent=2)
        )
        profile_data = await gemini.generate_json(prompt)

        # Build nested objects explicitly for validation
        hard_constraints = HardConstraints(**profile_data.pop("hard_constraints"))
        profile = FounderProfile(hard_constraints=hard_constraints, **profile_data)

        twin = DigitalTwin(
            twin_id=f"twin_{uuid.uuid4().hex[:8]}",
            raw_intake=intake,
            profile=profile,
        )

        logger.info(
            "Digital twin built",
            extra={"twin_id": twin.twin_id, "edge": profile.competitive_edge},
        )
        return twin

    except (KeyError, TypeError, ValueError) as e:
        logger.error("Twin inference schema mismatch", extra={"error": str(e)})
        raise TwinBuildError("TWIN_SCHEMA_ERROR", f"Profile schema mismatch: {str(e)}")
    except Exception as e:
        if isinstance(e, TwinBuildError):
            raise
        logger.error("Unexpected error building twin", extra={"error": str(e)})
        raise TwinBuildError("TWIN_BUILD_ERROR", str(e))

"""
Module: execution_engine.py
Description: Generates all 5 execution outputs (PRD, Financial Model, Pitch Deck,
             Tech Architecture, GitLab Project) from a completed board decision.
             All outputs constrained by the founder's DigitalTwin profile.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: services.gemini_service, services.gitlab_service, models.*
Exports: run_execution_engine
"""

import asyncio
from models.founder import DigitalTwin
from models.board import BoardDecision
from models.execution import (
    PRD, PRDFeature, FinancialModel, MonthlyProjection,
    PitchDeck, PitchSlide, TechArchitecture, ExecutionPackage,
)
from services.gemini_service import GeminiService
from services.gitlab_service import GitLabService
from utils.logger import get_logger
from utils.errors import ExecutionError

logger = get_logger(__name__)

PRD_PROMPT = """
Generate a Product Requirements Document for this startup.

FOUNDER TWIN (all constraints apply):
{twin_json}

BOARD DECISION:
{decision_json}

RULES:
- build_weeks must be realistic for a solo founder with their velocity ({velocity})
- mvp_features: only what proves the core value within the budget and timeline
- explicitly_excluded: features excluded because of this founder's specific constraints
- exclusion_note: reference SPECIFIC twin constraints (budget_inr, team_size, skills)

Return ONLY valid JSON:
{{
  "product_name": "...",
  "problem_statement": "...",
  "target_customer": "specific customer description, not a demographic",
  "build_weeks": <integer>,
  "mvp_features": [
    {{"name": "...", "description": "...", "priority": "must_have", "exclusion_reason": null}}
  ],
  "explicitly_excluded": [
    {{"name": "...", "description": "...", "priority": "wont_have", "exclusion_reason": "references specific twin constraint"}}
  ],
  "exclusion_note": "paragraph explaining the scope philosophy for THIS founder"
}}
"""

FINANCIAL_PROMPT = """
Generate a financial model for this startup using the founder's ACTUAL numbers.

FOUNDER TWIN:
{twin_json}

BOARD DECISION:
{decision_json}

RULES:
- budget_inr is {budget_inr} INR — use this exact number
- months_to_first_revenue: {months_to_revenue} months max
- CAC must be realistic for their network_strength ({network_strength}) and marketing_aptitude ({marketing_aptitude})
- Project exactly 6 months
- break_even_month and capital_recovered_month must be within the 6-month window or state if not achievable

Return ONLY valid JSON:
{{
  "cac_inr": <integer>,
  "ltv_inr": <integer>,
  "ltv_cac_ratio": <float>,
  "monthly_projections": [
    {{"month": 1, "burn_inr": <int>, "mrr_inr": <int>, "cumulative_spend_inr": <int>, "milestone": "..."}}
  ],
  "break_even_month": <integer 1-12>,
  "capital_recovered_month": <integer 1-12>,
  "verdict": "Viable|Marginal|Not viable"
}}
"""

PITCH_PROMPT = """
Generate a 7-slide investor pitch deck structure for this startup.

FOUNDER TWIN:
{twin_json}

BOARD DECISION:
{decision_json}

SLIDE STRUCTURE (strictly 7 slides):
1. Problem — specific pain, real numbers, real scale
2. Solution — what you're building and why it works
3. Why Now — timing signal, market shift, or regulatory change
4. Why Us — this founder's specific unfair advantage (from competitive_edge)
5. Traction — first customers, MRR target, early signals
6. Market — TAM/SAM/SOM with India-specific numbers
7. Ask — what funding, for what, targeting what milestone

Each slide MUST have a founder_specific_note explaining why this slide
is framed around THIS founder's actual edge, numbers, or constraints.

Return ONLY valid JSON:
{{
  "slides": [
    {{"slide_number": 1, "title": "...", "content": "...", "founder_specific_note": "..."}}
  ],
  "key_differentiator": "one sentence — this founder's real unfair advantage"
}}
"""

ARCH_PROMPT = """
Generate a technical architecture recommendation.

FOUNDER TWIN:
{twin_json}

BOARD DECISION:
{decision_json}

RULES:
- Stack MUST use technologies from their confirmed skills: {skills}
- No DevOps overhead for a solo founder (no Kubernetes, no complex infra)
- explicitly_avoided: list technologies this founder should NOT use and WHY
- avoidance_note: reference SPECIFIC twin constraints

Return ONLY valid JSON:
{{
  "frontend": "...",
  "backend": "...",
  "ai_layer": "...",
  "database": "...",
  "infra": "...",
  "explicitly_avoided": ["tech1", "tech2"],
  "avoidance_note": "paragraph explaining WHY — references twin constraints"
}}
"""

GITLAB_ISSUES_PROMPT = """
Generate GitLab project structure for this startup.

FOUNDER TWIN:
{twin_json}

PRD:
{prd_json}

TECH ARCHITECTURE:
{arch_json}

RULES:
- No issues for features marked wont_have in the PRD
- No DevOps issues if founder is solo (no Kubernetes, Docker orchestration, CI/CD pipelines)
- Estimated hours must be realistic for this founder's execution_velocity ({velocity})
- 4 milestones maximum, 4 epics maximum, 12-20 issues total
- Issues must be actionable tasks, not vague stories

Return ONLY valid JSON:
{{
  "milestones": ["Milestone 1: ...", "Milestone 2: ...", "Milestone 3: ...", "Milestone 4: ..."],
  "epics": ["Epic 1: ...", "Epic 2: ...", "Epic 3: ...", "Epic 4: ..."],
  "issues": [
    {{
      "title": "...",
      "description": "...",
      "milestone": "exact milestone name from above list",
      "epic": "exact epic name from above list",
      "estimated_hours": <integer>,
      "labels": ["backend|frontend|ai|infra|research"]
    }}
  ],
  "note": "paragraph explaining how this GitLab structure reflects the founder's profile"
}}
"""


async def run_execution_engine(
    twin: DigitalTwin,
    decision: BoardDecision,
    session_id: str,
    gitlab_token: str | None = None,
    gitlab_namespace: str | None = None,
) -> ExecutionPackage:
    """
    Generate all execution outputs from a completed board decision.

    PRD, financial model, pitch deck, and architecture run in parallel.
    GitLab project creation runs sequentially after issues are generated.

    Args:
        twin: Founder's DigitalTwin — all outputs constrained by this.
        decision: BoardDecision from the synthesizer.
        session_id: Session ID for tracking.
        gitlab_token: Optional GitLab personal access token.
        gitlab_namespace: Optional GitLab namespace.

    Returns:
        ExecutionPackage with all 5 outputs.

    Raises:
        ExecutionError: If any critical output generation fails.
    """
    gemini = GeminiService()

    try:
        twin_json = twin.model_dump_json(indent=2)
        decision_json = decision.model_dump_json(indent=2)
        constraints = twin.profile.hard_constraints
        skills = ", ".join(constraints.technical_skills)

        # Run PRD, financial, pitch, architecture in parallel
        prd_raw, financial_raw, pitch_raw, arch_raw = await asyncio.gather(
            gemini.generate_json(PRD_PROMPT.format(
                twin_json=twin_json, decision_json=decision_json,
                velocity=twin.profile.execution_velocity,
            )),
            gemini.generate_json(FINANCIAL_PROMPT.format(
                twin_json=twin_json, decision_json=decision_json,
                budget_inr=constraints.budget_inr,
                months_to_revenue=constraints.months_to_first_revenue,
                network_strength=twin.profile.network_strength,
                marketing_aptitude=twin.profile.marketing_aptitude,
            )),
            gemini.generate_json(PITCH_PROMPT.format(
                twin_json=twin_json, decision_json=decision_json,
            )),
            gemini.generate_json(ARCH_PROMPT.format(
                twin_json=twin_json, decision_json=decision_json, skills=skills,
            )),
        )

        # Parse outputs with nested models
        prd = _parse_prd(prd_raw)
        financial_model = _parse_financial(financial_raw)
        pitch_deck = _parse_pitch(pitch_raw)
        tech_arch = TechArchitecture(**arch_raw)
        logger.info("Parallel outputs generated", extra={"session_id": session_id})

        # Generate GitLab issues structure
        gitlab_data = await gemini.generate_json(
            GITLAB_ISSUES_PROMPT.format(
                twin_json=twin_json,
                prd_json=prd.model_dump_json(indent=2),
                arch_json=tech_arch.model_dump_json(indent=2),
                velocity=twin.profile.execution_velocity,
            )
        )

        # Create real GitLab project if credentials provided
        gitlab_output = None
        if gitlab_token and gitlab_namespace:
            try:
                gitlab_svc = GitLabService(token=gitlab_token, namespace=gitlab_namespace)
                gitlab_output = await gitlab_svc.create_project(
                    name=prd.product_name,
                    description=prd.problem_statement,
                    milestones=gitlab_data["milestones"],
                    epics=gitlab_data["epics"],
                    issues=gitlab_data["issues"],
                    note=gitlab_data["note"],
                )
                logger.info("GitLab project created", extra={"url": gitlab_output.project_url})
            except Exception as gl_err:
                logger.warning(
                    "GitLab creation failed — continuing without it",
                    extra={"error": str(gl_err)},
                )

        # If no GitLab project created, return structured output as simulated result
        if not gitlab_output:
            from models.execution import GitLabOutput, GitLabIssue
            gitlab_output = GitLabOutput(
                project_url="https://gitlab.com/darwin-agent/demo-project",
                project_id=0,
                milestones_created=gitlab_data.get("milestones", []),
                epics_created=gitlab_data.get("epics", []),
                issues_created=[
                    GitLabIssue(**i) for i in gitlab_data.get("issues", [])[:10]
                ],
                note=gitlab_data.get("note", "") + " (Demo mode — connect GitLab to create real project)",
            )

        return ExecutionPackage(
            session_id=session_id,
            prd=prd,
            financial_model=financial_model,
            pitch_deck=pitch_deck,
            tech_architecture=tech_arch,
            gitlab_output=gitlab_output,
        )

    except Exception as e:
        if isinstance(e, ExecutionError):
            raise
        logger.error("Execution engine failed", extra={"error": str(e)})
        raise ExecutionError("EXECUTION_ERROR", str(e))


def _parse_prd(data: dict) -> PRD:
    mvp_features = [PRDFeature(**f) for f in data.pop("mvp_features", [])]
    explicitly_excluded = [PRDFeature(**f) for f in data.pop("explicitly_excluded", [])]
    return PRD(mvp_features=mvp_features, explicitly_excluded=explicitly_excluded, **data)


def _parse_financial(data: dict) -> FinancialModel:
    projections = [MonthlyProjection(**p) for p in data.pop("monthly_projections", [])]
    return FinancialModel(monthly_projections=projections, **data)


def _parse_pitch(data: dict) -> PitchDeck:
    slides = [PitchSlide(**s) for s in data.pop("slides", [])]
    return PitchDeck(slides=slides, **data)

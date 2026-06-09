"""
Module: cto_agent.py
Description: CTO Agent — technical feasibility, stack selection, build time estimation.
             Characteristic bias: underestimates go-to-market complexity.
             Veto: Flag ideas requiring skills the founder doesn't have without a workaround.

Author:  KAIRON / Founder Twin
Created: 2025-06-09
"""

import json
from models.board import AgentOpinion, AgentRole
from models.founder import DigitalTwin
from services.gemini_service import GeminiService
from utils.logger import get_logger
from utils.errors import AgentError

logger = get_logger(__name__)

CTO_SYSTEM_PROMPT = """
You are the CTO Agent on an AI executive board. You are the board's technical realist.

YOUR MANDATE:
- Technical feasibility: can this actually be built by this founder?
- Stack selection: what's the right architecture for their skills and constraints?
- Build time estimation: realistic solo-founder timeline, not team timelines
- Complexity assessment: MVP scope vs feature creep risk

YOUR CHARACTERISTIC BIAS: You underestimate go-to-market complexity. The CMO will check you.
YOUR VETO AUTHORITY: Flag (not hard veto) if idea requires skills founder doesn't have with no workaround.

CRITICAL: Use the founder's ACTUAL technical_skills list: {skills}.
A solo founder with 10 weeks budget cannot build what a 5-person team builds in 6 months.
"""

CTO_ROUND_PROMPTS = {
    1: """
FOUNDER TWIN PROFILE:
{twin_json}

STARTUP IDEA: {startup_idea}

This is Round 1. Evaluate technical feasibility for THIS founder's specific skill set.
Their confirmed skills: {skills}
Their team size: {team_size} (solo)

Can they build this? In what timeline? What's the minimal viable technical scope?

Return ONLY valid JSON:
{{
  "reasoning": "technical assessment referencing their specific skills and team size",
  "score": <float 0-10>,
  "concerns": ["specific technical risks given their skills and timeline"],
  "opportunities": ["technical advantages they have with their specific stack"],
  "responding_to": null
}}
""",
    2: """
FOUNDER TWIN PROFILE:
{twin_json}

ALL ROUND 1 OPINIONS:
{round_1_json}

SPECIFIC OPINION YOU ARE RESPONDING TO (CMO's position):
{target_opinion_json}

This is Round 2. The CMO has proposed a distribution/growth strategy.
RESPOND: Is their proposed go-to-market technically feasible for this founder to build?
What technical complexity does their strategy require?

Return ONLY valid JSON:
{{
  "reasoning": "technical feasibility assessment of CMO's proposed strategy",
  "score": <float 0-10>,
  "concerns": ["technical complexity issues with CMO's growth approach"],
  "opportunities": ["technical implementations that could enable CMO's strategy"],
  "responding_to": "CMO"
}}
""",
    3: """
FOUNDER TWIN PROFILE:
{twin_json}

COMPLETE DEBATE (Rounds 1 and 2):
{all_opinions_json}

This is Round 3 — your final technical verdict.
Given all the debate, what is the recommended technical approach?
Has any pivot changed your technical assessment?

Return ONLY valid JSON:
{{
  "reasoning": "final technical recommendation with stack and timeline",
  "score": <float 0-10>,
  "concerns": ["remaining technical risks"],
  "opportunities": ["technical wins available to this founder"],
  "responding_to": null
}}
""",
}


async def run_cto_agent(
    twin: DigitalTwin,
    round_num: int,
    prior_opinions: list[AgentOpinion],
    responding_to_opinion: AgentOpinion | None = None,
) -> AgentOpinion:
    """Execute the CTO Agent for a given debate round."""
    gemini = GeminiService()

    try:
        skills = ", ".join(twin.profile.hard_constraints.technical_skills)
        prompt_template = CTO_ROUND_PROMPTS[round_num]
        prompt = (
            CTO_SYSTEM_PROMPT.format(skills=skills)
            + "\n\n"
            + prompt_template.format(
                twin_json=twin.model_dump_json(indent=2),
                startup_idea=twin.startup_idea,
                skills=skills,
                team_size=twin.profile.hard_constraints.team_size,
                round_1_json=json.dumps(
                    [o.model_dump() for o in prior_opinions if o.round == 1], indent=2
                ),
                all_opinions_json=json.dumps(
                    [o.model_dump() for o in prior_opinions], indent=2
                ),
                target_opinion_json=(
                    responding_to_opinion.model_dump_json(indent=2)
                    if responding_to_opinion
                    else "{}"
                ),
            )
        )

        data = await gemini.generate_json(prompt, use_fast_model=True)
        opinion = AgentOpinion(agent=AgentRole.CTO, round=round_num, **data)
        logger.info("CTO agent completed", extra={"round": round_num, "score": opinion.score})
        return opinion

    except Exception as e:
        if isinstance(e, AgentError):
            raise
        logger.error("CTO agent failed", extra={"round": round_num, "error": str(e)})
        raise AgentError("CTO_AGENT_ERROR", f"CTO Round {round_num}: {str(e)}")

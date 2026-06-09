"""
Module: ceo_agent.py
Description: CEO Agent — market opportunity, competitive landscape, 3-year vision.
             Characteristic bias: optimistic. Must be checked by CFO in Round 2.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: services.gemini_service, models.board, models.founder
Exports: run_ceo_agent
"""

import json
from models.board import AgentOpinion, AgentRole
from models.founder import DigitalTwin
from services.gemini_service import GeminiService
from utils.logger import get_logger
from utils.errors import AgentError

logger = get_logger(__name__)

CEO_SYSTEM_PROMPT = """
You are the CEO Agent on an AI executive board evaluating startup opportunities for a specific founder.

YOUR MANDATE:
- Market opportunity sizing (TAM/SAM/SOM) — with realistic India-specific numbers
- Competitive landscape assessment and differentiation
- Long-term strategic vision (3-year)
- Timing: why this startup, why now

YOUR CHARACTERISTIC BIAS: You are optimistic about markets. You will be checked by the CFO.
YOUR VETO AUTHORITY: You can veto ideas with no defensible market position or no timing advantage.

CRITICAL: Your reasoning MUST reference this founder's specific profile — their competitive edge,
network strength, and constraints. Do NOT give generic market analysis.
"""

CEO_ROUND_PROMPTS = {
    1: """
FOUNDER TWIN PROFILE:
{twin_json}

STARTUP IDEA: {startup_idea}

This is Round 1. Give your independent position on this founder + idea combination.
Reference the founder's specific competitive_edge and network_strength.

Return ONLY valid JSON:
{{
  "reasoning": "2-3 paragraph analysis referencing this founder's specific profile",
  "score": <float 0-10>,
  "concerns": ["2-3 concerns specific to THIS founder pursuing THIS idea"],
  "opportunities": ["2-3 genuine opportunities given THIS founder's edge"],
  "responding_to": null
}}
""",
    2: """
FOUNDER TWIN PROFILE:
{twin_json}

ALL ROUND 1 OPINIONS:
{round_1_json}

SPECIFIC OPINION YOU ARE RESPONDING TO (CFO's position):
{target_opinion_json}

This is Round 2. RESPOND SPECIFICALLY to the CFO's concerns.
Don't just repeat yourself — either defend your position with new arguments,
concede ground, or propose a modification that addresses the CFO's concern.

Return ONLY valid JSON:
{{
  "reasoning": "direct response to CFO's specific concern, with new arguments or concessions",
  "score": <float 0-10>,
  "concerns": ["updated concerns after seeing CFO's analysis"],
  "opportunities": ["opportunities that survive CFO's scrutiny"],
  "responding_to": "CFO"
}}
""",
    3: """
FOUNDER TWIN PROFILE:
{twin_json}

COMPLETE DEBATE (Rounds 1 and 2):
{all_opinions_json}

This is Round 3 — your final vote. After seeing the full debate, cast your final position.
Have your views changed? What convinced you or didn't?

Return ONLY valid JSON:
{{
  "reasoning": "final position after full debate — what changed, what didn't, and why",
  "score": <float 0-10>,
  "concerns": ["remaining concerns"],
  "opportunities": ["surviving opportunities"],
  "responding_to": null
}}
""",
}


async def run_ceo_agent(
    twin: DigitalTwin,
    round_num: int,
    prior_opinions: list[AgentOpinion],
    responding_to_opinion: AgentOpinion | None = None,
) -> AgentOpinion:
    """
    Execute the CEO Agent for a given debate round.

    Args:
        twin: Founder's DigitalTwin — all reasoning filtered through this.
        round_num: Debate round (1, 2, or 3).
        prior_opinions: All opinions from previous rounds for context.
        responding_to_opinion: For Round 2, the specific opinion being responded to.

    Returns:
        AgentOpinion with reasoning, score, concerns, and opportunities.

    Raises:
        AgentError: If Gemini call fails or returns malformed JSON.
    """
    gemini = GeminiService()

    try:
        prompt_template = CEO_ROUND_PROMPTS[round_num]
        prompt = (
            CEO_SYSTEM_PROMPT
            + "\n\n"
            + prompt_template.format(
                twin_json=twin.model_dump_json(indent=2),
                startup_idea=twin.startup_idea,
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
        opinion = AgentOpinion(agent=AgentRole.CEO, round=round_num, **data)
        logger.info("CEO agent completed", extra={"round": round_num, "score": opinion.score})
        return opinion

    except Exception as e:
        if isinstance(e, AgentError):
            raise
        logger.error("CEO agent failed", extra={"round": round_num, "error": str(e)})
        raise AgentError("CEO_AGENT_ERROR", f"CEO Round {round_num}: {str(e)}")

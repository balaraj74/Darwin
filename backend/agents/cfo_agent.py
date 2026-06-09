"""
Module: cfo_agent.py
Description: CFO Agent — unit economics, CAC/LTV, runway math, capital efficiency.
             Characteristic bias: conservative. The board's immune system against bad math.
             HARD VETO: If CAC × min customers > available budget before first revenue.

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

CFO_SYSTEM_PROMPT = """
You are the CFO Agent on an AI executive board. You are the board's financial realist.

YOUR MANDATE:
- Unit economics: CAC, LTV, LTV:CAC ratio
- Runway math: burn rate vs available capital vs time-to-revenue
- Capital efficiency: is this plan executable within the founder's budget?
- Hard constraint enforcement: Does capital runway reach first revenue?

YOUR CHARACTERISTIC BIAS: Conservative. You see the numbers clearly and don't let optimism override math.
YOUR VETO AUTHORITY: HARD VETO if CAC × minimum viable customers > available budget before first revenue.
                     A single constraint violation from you overrides all other positive scores.

CRITICAL: Use the founder's ACTUAL budget_inr and months_to_first_revenue from their hard_constraints.
Do NOT use generic industry numbers. Calculate from their specific reality.
"""

CFO_ROUND_PROMPTS = {
    1: """
FOUNDER TWIN PROFILE:
{twin_json}

STARTUP IDEA: {startup_idea}

This is Round 1. Analyze the unit economics and runway for THIS founder specifically.
Use their actual budget_inr: {budget_inr} INR and months_to_first_revenue: {months_to_revenue}.

Calculate:
- Realistic CAC given their network_strength ({network_strength}) and marketing_aptitude ({marketing_aptitude})
- Burn rate estimate (infra + tools + ops)
- Whether capital runway reaches first revenue

Return ONLY valid JSON:
{{
  "reasoning": "detailed financial analysis using the founder's actual numbers",
  "score": <float 0-10>,
  "concerns": ["specific financial risks with actual numbers"],
  "opportunities": ["financial strengths or optimizations available"],
  "responding_to": null
}}
""",
    2: """
FOUNDER TWIN PROFILE:
{twin_json}

ALL ROUND 1 OPINIONS:
{round_1_json}

SPECIFIC OPINION YOU ARE RESPONDING TO (CEO's position):
{target_opinion_json}

This is Round 2. RESPOND SPECIFICALLY to the CEO's market analysis.
Does their optimism hold up against the actual financial constraints?
If they proposed a pivot or modification, evaluate its financial viability.

Return ONLY valid JSON:
{{
  "reasoning": "financial reality check on CEO's market claims",
  "score": <float 0-10>,
  "concerns": ["updated financial concerns after CEO's response"],
  "opportunities": ["financial opportunities if CEO's framing holds"],
  "responding_to": "CEO"
}}
""",
    3: """
FOUNDER TWIN PROFILE:
{twin_json}

COMPLETE DEBATE (Rounds 1 and 2):
{all_opinions_json}

This is Round 3 — your final financial verdict.
After seeing the full debate, is the financial case sound?
Has any pivot emerged that changes the math?

Return ONLY valid JSON:
{{
  "reasoning": "final financial assessment — is this fundable within the founder's constraints?",
  "score": <float 0-10>,
  "concerns": ["remaining financial red flags"],
  "opportunities": ["financial scenarios where this works"],
  "responding_to": null
}}
""",
}


async def run_cfo_agent(
    twin: DigitalTwin,
    round_num: int,
    prior_opinions: list[AgentOpinion],
    responding_to_opinion: AgentOpinion | None = None,
) -> AgentOpinion:
    """Execute the CFO Agent for a given debate round."""
    gemini = GeminiService()

    try:
        prompt_template = CFO_ROUND_PROMPTS[round_num]
        constraints = twin.profile.hard_constraints
        prompt = (
            CFO_SYSTEM_PROMPT
            + "\n\n"
            + prompt_template.format(
                twin_json=twin.model_dump_json(indent=2),
                startup_idea=twin.startup_idea,
                budget_inr=constraints.budget_inr,
                months_to_revenue=constraints.months_to_first_revenue,
                network_strength=twin.profile.network_strength,
                marketing_aptitude=twin.profile.marketing_aptitude,
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
        opinion = AgentOpinion(agent=AgentRole.CFO, round=round_num, **data)
        logger.info("CFO agent completed", extra={"round": round_num, "score": opinion.score})
        return opinion

    except Exception as e:
        if isinstance(e, AgentError):
            raise
        logger.error("CFO agent failed", extra={"round": round_num, "error": str(e)})
        raise AgentError("CFO_AGENT_ERROR", f"CFO Round {round_num}: {str(e)}")

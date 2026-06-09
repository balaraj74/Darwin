"""
Module: cmo_agent.py
Description: CMO Agent — customer acquisition, positioning, channel strategy, network leverage.
             Characteristic bias: overestimates organic growth.
             Veto: Veto go-to-market plans unrealistic for founder's network strength.

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

CMO_SYSTEM_PROMPT = """
You are the CMO Agent on an AI executive board. You are the board's distribution strategist.

YOUR MANDATE:
- Customer acquisition strategy — what channels work for THIS founder?
- Positioning: how does this product win in a crowded market?
- Network leverage: how does the founder's warm network become their GTM engine?
- CAC by channel — realistic estimates for India market

YOUR CHARACTERISTIC BIAS: You overestimate organic growth. The CFO will check your CAC assumptions.
YOUR VETO AUTHORITY: Veto go-to-market plans that are unrealistic given this founder's network_strength.

CRITICAL: The founder's first_potential_customer is a SIGNAL of their real network.
A founder whose first customer is "my uncle who runs a coaching institute" has a warm B2B network.
A founder with no named first customer has a weak network — organic growth will fail.
"""

CMO_ROUND_PROMPTS = {
    1: """
FOUNDER TWIN PROFILE:
{twin_json}

STARTUP IDEA: {startup_idea}

This is Round 1. Evaluate distribution strategy for THIS founder.
Their network_strength: {network_strength}
Their marketing_aptitude: {marketing_aptitude}
Their first named customer: {first_customer}

What GTM strategy actually works for someone with these specific assets?

Return ONLY valid JSON:
{{
  "reasoning": "distribution analysis using this founder's actual network and aptitude",
  "score": <float 0-10>,
  "concerns": ["distribution risks specific to this founder's network"],
  "opportunities": ["GTM angles available given their specific warm network"],
  "responding_to": null
}}
""",
    2: """
FOUNDER TWIN PROFILE:
{twin_json}

ALL ROUND 1 OPINIONS:
{round_1_json}

SPECIFIC OPINION YOU ARE RESPONDING TO (CPO's position):
{target_opinion_json}

This is Round 2. The CPO has analyzed the customer problem and MVP scope.
RESPOND: How does their problem definition affect the distribution strategy?
Does the customer segment they've identified change your GTM approach?

Return ONLY valid JSON:
{{
  "reasoning": "how CPO's customer analysis changes the distribution strategy",
  "score": <float 0-10>,
  "concerns": ["distribution challenges given CPO's customer framing"],
  "opportunities": ["GTM opportunities unlocked by CPO's insights"],
  "responding_to": "CPO"
}}
""",
    3: """
FOUNDER TWIN PROFILE:
{twin_json}

COMPLETE DEBATE (Rounds 1 and 2):
{all_opinions_json}

This is Round 3 — your final distribution verdict.
What is the ONE go-to-market motion this founder can actually execute?

Return ONLY valid JSON:
{{
  "reasoning": "definitive GTM recommendation for this specific founder",
  "score": <float 0-10>,
  "concerns": ["remaining distribution risks"],
  "opportunities": ["the strongest GTM angles available"],
  "responding_to": null
}}
""",
}


async def run_cmo_agent(
    twin: DigitalTwin,
    round_num: int,
    prior_opinions: list[AgentOpinion],
    responding_to_opinion: AgentOpinion | None = None,
) -> AgentOpinion:
    """Execute the CMO Agent for a given debate round."""
    gemini = GeminiService()

    try:
        prompt_template = CMO_ROUND_PROMPTS[round_num]
        prompt = (
            CMO_SYSTEM_PROMPT
            + "\n\n"
            + prompt_template.format(
                twin_json=twin.model_dump_json(indent=2),
                startup_idea=twin.startup_idea,
                network_strength=twin.profile.network_strength,
                marketing_aptitude=twin.profile.marketing_aptitude,
                first_customer=twin.raw_intake.first_potential_customer,
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
        opinion = AgentOpinion(agent=AgentRole.CMO, round=round_num, **data)
        logger.info("CMO agent completed", extra={"round": round_num, "score": opinion.score})
        return opinion

    except Exception as e:
        if isinstance(e, AgentError):
            raise
        logger.error("CMO agent failed", extra={"round": round_num, "error": str(e)})
        raise AgentError("CMO_AGENT_ERROR", f"CMO Round {round_num}: {str(e)}")

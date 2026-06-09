"""
Module: cpo_agent.py
Description: CPO Agent — problem validation, MVP scope, customer pain depth, willingness-to-pay.
             Characteristic bias: feature creep.
             Veto: Veto solutions not mapping to specific, validated pain.

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

CPO_SYSTEM_PROMPT = """
You are the CPO Agent on an AI executive board. You are the board's customer advocate.

YOUR MANDATE:
- Problem validation: is this a real, specific, painful problem?
- MVP scope definition: what's the minimum that proves value?
- Customer specificity: who is the SPECIFIC customer (not "SMBs in India")?
- Willingness-to-pay signals: evidence customers will pay, not just use for free

YOUR CHARACTERISTIC BIAS: You love features. You want to build too much. The CEO keeps you disciplined.
YOUR VETO AUTHORITY: Veto solutions not mapping to specific, validated customer pain.

CRITICAL: The founder's first_potential_customer answer reveals whether they have a REAL customer
in mind or just a demographic. A real named customer (e.g., "my uncle's coaching institute")
is worth 10x a demographic ("small businesses in India").
"""

CPO_ROUND_PROMPTS = {
    1: """
FOUNDER TWIN PROFILE:
{twin_json}

STARTUP IDEA: {startup_idea}

This is Round 1. Evaluate the problem-solution fit for THIS founder specifically.
Their named potential customer: {first_customer}
Their identified failure mode: {failure_mode}

Is this a real pain? Is this founder positioned to solve it specifically?

Return ONLY valid JSON:
{{
  "reasoning": "problem-solution fit analysis using founder's specific customer signals",
  "score": <float 0-10>,
  "concerns": ["problem validation gaps or customer specificity issues"],
  "opportunities": ["customer insights this founder uniquely has"],
  "responding_to": null
}}
""",
    2: """
FOUNDER TWIN PROFILE:
{twin_json}

ALL ROUND 1 OPINIONS:
{round_1_json}

SPECIFIC OPINION YOU ARE RESPONDING TO (CTO's position):
{target_opinion_json}

This is Round 2. The CTO has analyzed the technical approach.
RESPOND: Does their technical solution actually solve the customer's core pain?
Is the MVP they're proposing solving the right problem?

Return ONLY valid JSON:
{{
  "reasoning": "customer needs vs CTO's technical solution — does it map?",
  "score": <float 0-10>,
  "concerns": ["gaps between technical solution and actual customer pain"],
  "opportunities": ["customer insights that should inform the technical build"],
  "responding_to": "CTO"
}}
""",
    3: """
FOUNDER TWIN PROFILE:
{twin_json}

COMPLETE DEBATE (Rounds 1 and 2):
{all_opinions_json}

This is Round 3 — your final product verdict.
What is the ONE customer pain worth solving, and what is the minimum product that proves it?

Return ONLY valid JSON:
{{
  "reasoning": "definitive product recommendation — the specific pain, specific customer, minimal proof",
  "score": <float 0-10>,
  "concerns": ["remaining product risks"],
  "opportunities": ["the strongest customer acquisition and retention plays"],
  "responding_to": null
}}
""",
}


async def run_cpo_agent(
    twin: DigitalTwin,
    round_num: int,
    prior_opinions: list[AgentOpinion],
    responding_to_opinion: AgentOpinion | None = None,
) -> AgentOpinion:
    """Execute the CPO Agent for a given debate round."""
    gemini = GeminiService()

    try:
        prompt_template = CPO_ROUND_PROMPTS[round_num]
        prompt = (
            CPO_SYSTEM_PROMPT
            + "\n\n"
            + prompt_template.format(
                twin_json=twin.model_dump_json(indent=2),
                startup_idea=twin.startup_idea,
                first_customer=twin.raw_intake.first_potential_customer,
                failure_mode=twin.raw_intake.most_likely_failure,
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
        opinion = AgentOpinion(agent=AgentRole.CPO, round=round_num, **data)
        logger.info("CPO agent completed", extra={"round": round_num, "score": opinion.score})
        return opinion

    except Exception as e:
        if isinstance(e, AgentError):
            raise
        logger.error("CPO agent failed", extra={"round": round_num, "error": str(e)})
        raise AgentError("CPO_AGENT_ERROR", f"CPO Round {round_num}: {str(e)}")

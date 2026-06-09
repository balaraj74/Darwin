"""
Module: decision_synthesizer.py
Description: Synthesizes board debate into a final decision using hard constraint logic.
             Hard constraints evaluated BEFORE soft scores.
             CFO budget veto is absolute — overrides all other positive scores.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: models.board, models.founder, services.gemini_service
Exports: synthesize_decision
"""

import json
from models.board import BoardSession, BoardDecision, HardConstraintViolation
from models.founder import DigitalTwin
from services.gemini_service import GeminiService
from utils.logger import get_logger
from utils.errors import SynthesisError

logger = get_logger(__name__)

SYNTHESIS_PROMPT = """
You are the Chairman of the AI Executive Board. You have the complete 3-round debate transcript.
Your job: synthesize a final decision using STRICT decision rules.

FOUNDER TWIN PROFILE:
{twin_json}

COMPLETE DEBATE TRANSCRIPT:
{debate_transcript}

DECISION RULES — apply in this STRICT ORDER:

1. HARD CONSTRAINTS (evaluated first — any violation = REJECT or PIVOT, never PROCEED):
   - If CFO identifies capital runway does NOT reach first revenue → HARD VETO → must PIVOT or REJECT
   - If CTO identifies required skills founder doesn't have with no workaround → HARD VETO
   - If time-to-revenue exceeds founder's months_to_first_revenue ({months_to_revenue} months) → HARD VETO

2. SOFT SCORES (only evaluated if all hard constraints pass):
   - Weights: Market/CEO=25%, Viability/CFO=30%, Feasibility/CTO=20%, Distribution/CMO=15%, Customer/CPO=10%

3. PIVOT LOGIC — if original idea rejected but debate surfaced a BETTER idea:
   - Search the cross-examination (Round 2) for emergent alternative ideas
   - If a better-fit idea emerged, recommend it as recommended_idea with full pivot_reasoning
   - The pivot must be better for THIS SPECIFIC FOUNDER given their constraints

4. THE MEMORABLE LINE: key_insight must be ONE sentence the founder will remember walking out.

Return ONLY valid JSON:
{{
  "decision": "PROCEED|PIVOT|REJECT",
  "original_idea": "the idea the founder came in with",
  "recommended_idea": "the approved idea (same as original if PROCEED, pivot idea if PIVOT)",
  "pivot_reasoning": "one paragraph: why this is better for THIS founder specifically (null if PROCEED)",
  "hard_constraint_violations": [
    {{"constraint": "...", "details": "...", "severity": "fatal|warning"}}
  ],
  "votes": [
    {{"agent": "CEO|CFO|CTO|CMO|CPO", "vote": "PROCEED|NO|NEUTRAL", "vote_reason": "one sentence"}}
  ],
  "founder_fit_score": <0-100>,
  "viability_score": <0-100>,
  "overall_score": <0-100>,
  "confidence": <0-100>,
  "key_insight": "one memorable sentence — the line they walk out remembering"
}}
"""


def _format_debate_transcript(session: BoardSession) -> str:
    """
    Format all debate rounds into a readable transcript for synthesis.

    Args:
        session: BoardSession with completed rounds.

    Returns:
        Formatted string transcript of all rounds.
    """
    lines = []
    labels = {
        1: "ROUND 1 — INITIAL POSITIONS",
        2: "ROUND 2 — CROSS-EXAMINATION",
        3: "ROUND 3 — FINAL VOTE",
    }
    for round_idx, round_opinions in enumerate(session.rounds, start=1):
        lines.append(f"\n=== {labels.get(round_idx, f'ROUND {round_idx}')} ===")
        for opinion in round_opinions:
            prefix = f"[Responding to {opinion.responding_to}] " if opinion.responding_to else ""
            lines.append(f"\n{opinion.agent}: {prefix}")
            lines.append(f"  Score: {opinion.score}/10")
            lines.append(f"  Reasoning: {opinion.reasoning}")
            if opinion.concerns:
                lines.append(f"  Concerns: {', '.join(opinion.concerns)}")
            if opinion.opportunities:
                lines.append(f"  Opportunities: {', '.join(opinion.opportunities)}")
    return "\n".join(lines)


async def synthesize_decision(session: BoardSession, twin: DigitalTwin) -> BoardDecision:
    """
    Produce a final BoardDecision from completed debate rounds.

    Hard constraints checked first. A single CFO budget veto overrides
    any optimistic CEO score. Pivot logic searches debate transcripts
    for emergent ideas that better fit this founder.

    Args:
        session: BoardSession with 3 completed rounds.
        twin: DigitalTwin for constraint evaluation.

    Returns:
        BoardDecision with decision, reasoning, scores, and votes.

    Raises:
        SynthesisError: If synthesis fails or returns invalid JSON.
    """
    gemini = GeminiService()

    try:
        transcript = _format_debate_transcript(session)
        prompt = SYNTHESIS_PROMPT.format(
            twin_json=twin.model_dump_json(indent=2),
            debate_transcript=transcript,
            months_to_revenue=twin.profile.hard_constraints.months_to_first_revenue,
        )

        data = await gemini.generate_json(prompt)

        # Build nested objects
        violations = [
            HardConstraintViolation(**v)
            for v in data.pop("hard_constraint_violations", [])
        ]
        from models.board import VoteResult, VoteChoice, AgentRole
        votes = [
            VoteResult(
                agent=AgentRole(v["agent"]),
                vote=VoteChoice(v["vote"]),
                vote_reason=v["vote_reason"],
            )
            for v in data.pop("votes", [])
        ]

        decision = BoardDecision(
            hard_constraint_violations=violations,
            votes=votes,
            **data,
        )

        logger.info(
            "Decision synthesized",
            extra={
                "session_id": session.session_id,
                "decision": decision.decision,
                "overall_score": decision.overall_score,
            },
        )
        return decision

    except Exception as e:
        if isinstance(e, SynthesisError):
            raise
        logger.error("Decision synthesis failed", extra={"error": str(e)})
        raise SynthesisError("SYNTHESIS_ERROR", str(e))

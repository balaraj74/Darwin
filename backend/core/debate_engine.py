"""
Module: debate_engine.py
Description: Orchestrates the 3-round structured debate between the 5 executive board agents.
             Round 1: Independent positions (parallel).
             Round 2: Cross-examination (sequential — each agent sees prior opinion).
             Round 3: Final vote (parallel, sees all prior).

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: agents.*, models.board, models.founder
Exports: run_debate
"""

import asyncio
from models.founder import DigitalTwin
from models.board import AgentOpinion, AgentRole, BoardSession
from agents.ceo_agent import run_ceo_agent
from agents.cfo_agent import run_cfo_agent
from agents.cto_agent import run_cto_agent
from agents.cmo_agent import run_cmo_agent
from agents.cpo_agent import run_cpo_agent
from config.constants import CROSS_EXAMINATION_PAIRS
from utils.logger import get_logger
from utils.errors import DebateError
from services.mongodb_service import MongoDBService

logger = get_logger(__name__)
db = MongoDBService()

AGENT_RUNNERS = {
    AgentRole.CEO: run_ceo_agent,
    AgentRole.CFO: run_cfo_agent,
    AgentRole.CTO: run_cto_agent,
    AgentRole.CMO: run_cmo_agent,
    AgentRole.CPO: run_cpo_agent,
}


async def run_debate(session: BoardSession, twin: DigitalTwin) -> BoardSession:
    """
    Execute the full 3-round debate protocol.

    Round 1: All 5 agents run in parallel — independent initial positions.
    Round 2: 5 cross-examination pairs run sequentially — each agent responds
             specifically to a counterpart's Round 1 position.
    Round 3: All 5 agents run in parallel — final vote after seeing full debate.

    Args:
        session: BoardSession with empty rounds list.
        twin: Founder's DigitalTwin providing all profile context.

    Returns:
        Updated BoardSession with all 3 rounds populated.

    Raises:
        DebateError: If any agent call fails critically.
    """
    try:
        # === ROUND 1: Independent positions (parallel) ===
        logger.info("Debate Round 1 starting", extra={"session_id": session.session_id})
        session.status = "debating"
        await db.save_session(session)

        round_1_tasks = [
            runner(twin=twin, round_num=1, prior_opinions=[])
            for runner in AGENT_RUNNERS.values()
        ]
        round_1_opinions: list[AgentOpinion] = list(await asyncio.gather(*round_1_tasks))
        session.rounds.append(round_1_opinions)
        await db.save_session(session)
        logger.info("Round 1 complete", extra={"count": len(round_1_opinions)})

        # === ROUND 2: Cross-examination (sequential) ===
        logger.info("Debate Round 2 starting")
        round_2_opinions: list[AgentOpinion] = []

        for (responder_name, target_name) in CROSS_EXAMINATION_PAIRS:
            responder = AgentRole(responder_name)
            target = AgentRole(target_name)
            target_opinion = next(
                (o for o in round_1_opinions if o.agent == target), None
            )
            if not target_opinion:
                continue

            opinion = await AGENT_RUNNERS[responder](
                twin=twin,
                round_num=2,
                prior_opinions=round_1_opinions,
                responding_to_opinion=target_opinion,
            )
            round_2_opinions.append(opinion)

        session.rounds.append(round_2_opinions)
        await db.save_session(session)
        logger.info("Round 2 complete", extra={"count": len(round_2_opinions)})

        # === ROUND 3: Final vote (parallel, sees all prior opinions) ===
        logger.info("Debate Round 3 — voting")
        all_prior = round_1_opinions + round_2_opinions
        round_3_tasks = [
            runner(twin=twin, round_num=3, prior_opinions=all_prior)
            for runner in AGENT_RUNNERS.values()
        ]
        round_3_opinions: list[AgentOpinion] = list(await asyncio.gather(*round_3_tasks))
        session.rounds.append(round_3_opinions)
        await db.save_session(session)
        logger.info("Round 3 complete — debate finished")

        return session

    except Exception as e:
        logger.error(
            "Debate engine failed",
            extra={"error": str(e), "session_id": session.session_id},
        )
        raise DebateError("DEBATE_FAILED", f"Board debate interrupted: {str(e)}")

"""
Module: board.py
Description: Pydantic models for board debate rounds, agent opinions, and decisions.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: pydantic
Exports: AgentOpinion, DebateRound, VoteResult, BoardDecision, BoardSession
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime, timezone


class AgentRole(str, Enum):
    CEO = "CEO"
    CFO = "CFO"
    CTO = "CTO"
    CMO = "CMO"
    CPO = "CPO"


class VoteChoice(str, Enum):
    PROCEED = "PROCEED"
    NO = "NO"
    NEUTRAL = "NEUTRAL"


class AgentOpinion(BaseModel):
    """A single agent's position in a debate round."""

    agent: AgentRole
    round: int = Field(..., ge=1, le=3)
    reasoning: str = Field(..., description="Full reasoning paragraph")
    score: float = Field(..., ge=0, le=10)
    concerns: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    responding_to: Optional[str] = Field(
        None, description="For Round 2: which agent this responds to"
    )


class VoteResult(BaseModel):
    """Final vote from each agent."""

    agent: AgentRole
    vote: VoteChoice
    vote_reason: str


class HardConstraintViolation(BaseModel):
    """A specific hard constraint that was violated."""

    constraint: str
    details: str
    severity: str = Field(..., description="fatal | warning")


class BoardDecision(BaseModel):
    """Final synthesized decision from the board."""

    decision: str = Field(..., description="PROCEED | PIVOT | REJECT")
    original_idea: str
    recommended_idea: str
    pivot_reasoning: Optional[str] = None
    hard_constraint_violations: list[HardConstraintViolation] = Field(default_factory=list)
    votes: list[VoteResult] = Field(default_factory=list)
    founder_fit_score: float = Field(..., ge=0, le=100)
    viability_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=100)
    key_insight: str = Field(..., description="One memorable sentence summarizing the board's conclusion")


class DebateRound(BaseModel):
    opinions: list[AgentOpinion] = Field(default_factory=list)


class BoardSession(BaseModel):
    """Complete board meeting session."""

    session_id: str
    twin_id: str
    rounds: list[DebateRound] = Field(default_factory=list)
    decision: Optional[BoardDecision] = None
    status: str = Field(default="pending", description="pending | debating | decided | executed")
    created_at: Optional[str] = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp of when this session was created",
    )

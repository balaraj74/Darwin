# darwin agent — MASTER BUILD PROMPT
**Version:** 1.0  
**Project:** Darwin Agent: AI Board of Directors  
**Author:** Balu (ERROR_404_NOT_FOUND)

---

## CONTEXT — READ THIS FIRST

You are building **Darwin Agent**, a production-grade multi-agent AI platform that creates a digital representation of a startup founder, assembles a 5-agent AI board of directors, runs a structured 3-round debate, and executes real outputs including a GitLab project with milestones, epics, and sprint issues.

This is a hackathon submission targeting a **9.8/10 score**. Every file must be production-grade. There are no placeholders, no stubs, no TODOs. Every component ships complete.

The tagline: *"An AI executive board that builds startups tailored to the founder, not just the idea."*

---

## TECH STACK — NON-NEGOTIABLE

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion |
| 3D / Visual | React Three Fiber, @react-three/drei |
| Backend | FastAPI (Python 3.11), async, Pydantic v2 |
| LLM | Google Gemini 3.0 Flash (`gemini-3.0-flash`) |
| Agent Orchestration | LangGraph (StateGraph, cyclic debate loops) |
| Database | MongoDB Atlas (twin persistence, board meeting history) |
| GitLab Integration | GitLab REST API v4 (create project, milestones, epics, issues) |
| Auth | NextAuth.js (Google OAuth) |
| Deployment | Vercel (frontend) + Google Cloud Run (backend) |

---

## PROJECT STRUCTURE

```
founder-twin/
├── frontend/                        ← Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 ← Landing page
│   │   ├── globals.css
│   │   ├── onboarding/
│   │   │   └── page.tsx             ← Conversational intake (7 questions)
│   │   ├── board/
│   │   │   └── page.tsx             ← Live board debate view
│   │   ├── results/
│   │   │   └── page.tsx             ← Final decision + outputs
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── Scene.tsx
│   │   │   ├── FounderOrb.tsx       ← Pulsing orb = founder twin alive
│   │   │   └── Particles.tsx
│   │   ├── sections/
│   │   │   ├── Hero.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── Features.tsx
│   │   │   └── Footer.tsx
│   │   ├── onboarding/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── TwinBuilding.tsx     ← Animated twin construction visual
│   │   ├── board/
│   │   │   ├── BoardRoom.tsx        ← Full debate UI
│   │   │   ├── AgentCard.tsx        ← Per-agent card with avatar + message
│   │   │   ├── DebateTimeline.tsx   ← Round 1 → 2 → 3 progress
│   │   │   ├── VoteDisplay.tsx      ← Voting animation
│   │   │   └── PivotMoment.tsx      ← Highlighted pivot reveal
│   │   ├── results/
│   │   │   ├── DecisionBanner.tsx
│   │   │   ├── PRDPanel.tsx
│   │   │   ├── FinancialModel.tsx
│   │   │   ├── PitchOutline.tsx
│   │   │   ├── ArchitecturePanel.tsx
│   │   │   └── GitLabStatus.tsx     ← Live GitLab project creation status
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── GlowCard.tsx
│   │       ├── Badge.tsx
│   │       └── Navbar.tsx
│   ├── lib/
│   │   ├── api.ts                   ← All backend API calls
│   │   ├── types.ts                 ← Shared TypeScript interfaces
│   │   └── constants.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── package.json
│
├── backend/                         ← FastAPI
│   ├── main.py                      ← App entry, CORS, router mounts
│   ├── config/
│   │   ├── env.py                   ← Pydantic Settings, validates all env vars
│   │   └── constants.py
│   ├── routers/
│   │   ├── onboarding.py            ← POST /onboarding/analyze
│   │   ├── board.py                 ← POST /board/start, GET /board/{id}/stream
│   │   └── execution.py             ← POST /execution/run
│   ├── agents/
│   │   ├── supervisor.py            ← LangGraph StateGraph orchestrator
│   │   ├── ceo_agent.py
│   │   ├── cfo_agent.py
│   │   ├── cto_agent.py
│   │   ├── cmo_agent.py
│   │   └── cpo_agent.py
│   ├── core/
│   │   ├── digital_twin.py          ← Twin inference from intake answers
│   │   ├── debate_engine.py         ← 3-round protocol, cross-examination
│   │   ├── decision_synthesizer.py  ← Hard constraints + vote logic
│   │   └── execution_engine.py      ← PRD, financials, pitch, GitLab
│   ├── services/
│   │   ├── gemini_service.py        ← Gemini 2.0 Flash wrapper
│   │   ├── mongodb_service.py       ← Twin + session persistence
│   │   └── gitlab_service.py        ← GitLab REST API v4 integration
│   ├── models/
│   │   ├── founder.py               ← Pydantic: FounderProfile, DigitalTwin
│   │   ├── board.py                 ← AgentOpinion, DebateRound, BoardDecision
│   │   └── execution.py             ← PRD, FinancialModel, GitLabOutput
│   ├── utils/
│   │   ├── logger.py
│   │   └── errors.py
│   ├── tests/
│   │   ├── test_digital_twin.py
│   │   ├── test_debate_engine.py
│   │   ├── test_decision_synthesizer.py
│   │   └── test_gitlab_service.py
│   └── requirements.txt
│
├── .env.example
└── README.md
```

---

## PHASE 1 — BACKEND: DATA MODELS

### `backend/models/founder.py`

```python
"""
Module: founder.py
Description: Pydantic models for founder profile, digital twin, and onboarding intake.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: pydantic
Exports: OnboardingIntake, FounderProfile, DigitalTwin, HardConstraints
"""

from pydantic import BaseModel, Field
from typing import Optional


class OnboardingIntake(BaseModel):
    """Raw answers from the 7-question conversational intake."""

    what_can_you_build: str = Field(..., description="Skills the founder has right now")
    capital_available: str = Field(..., description="Capital they can deploy in 6 months")
    what_makes_you_quit: str = Field(..., description="Honest quit triggers")
    first_potential_customer: str = Field(..., description="Someone who would pay tomorrow")
    hardest_thing_shipped: str = Field(..., description="Hardest shipped project + timeline")
    draining_work: str = Field(..., description="Work that drains them despite competence")
    most_likely_failure: str = Field(..., description="Most likely reason this fails in 12 months")
    startup_idea: str = Field(..., description="The idea they want to pursue")


class HardConstraints(BaseModel):
    """Non-negotiable constraints extracted from founder profile."""

    budget_inr: int = Field(..., description="Total available capital in INR")
    months_to_first_revenue: int = Field(..., description="Max months before needing revenue")
    team_size: int = Field(default=1, description="Number of founders/team members")
    technical_skills: list[str] = Field(default_factory=list)
    no_go_domains: list[str] = Field(default_factory=list, description="Domains founder refuses")


class FounderProfile(BaseModel):
    """Inferred founder profile — derived from intake answers, not stored directly."""

    technical_depth: str = Field(..., description="low | medium | high")
    execution_velocity: str = Field(..., description="slow | medium | fast")
    risk_tolerance: str = Field(..., description="low | medium-low | medium | medium-high | high")
    network_strength: str = Field(..., description="weak | medium | strong")
    marketing_aptitude: str = Field(..., description="low | medium | high")
    competitive_edge: str = Field(..., description="One sentence: founder's real edge")
    blind_spots: list[str] = Field(default_factory=list)
    quit_triggers: list[str] = Field(default_factory=list)
    hard_constraints: HardConstraints


class DigitalTwin(BaseModel):
    """The living digital representation of the founder."""

    twin_id: str
    founder_name: Optional[str] = None
    raw_intake: OnboardingIntake
    profile: FounderProfile
    startup_idea: str
    session_count: int = 0
    evolution_log: list[str] = Field(default_factory=list, description="How twin changed over sessions")
```

### `backend/models/board.py`

```python
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
    responding_to: Optional[AgentRole] = Field(None, description="For Round 2: which agent this responds to")


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


class BoardSession(BaseModel):
    """Complete board meeting session stored in MongoDB."""

    session_id: str
    twin_id: str
    rounds: list[list[AgentOpinion]] = Field(default_factory=list)
    decision: Optional[BoardDecision] = None
    status: str = Field(default="pending", description="pending | debating | decided | executed")
```

### `backend/models/execution.py`

```python
"""
Module: execution.py
Description: Pydantic models for all execution engine outputs.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: pydantic
Exports: PRD, FinancialModel, PitchDeck, TechArchitecture, GitLabOutput, ExecutionPackage
"""

from pydantic import BaseModel, Field
from typing import Optional


class PRDFeature(BaseModel):
    name: str
    description: str
    priority: str = Field(..., description="must_have | should_have | wont_have")
    exclusion_reason: Optional[str] = Field(None, description="Why excluded — links to twin constraints")


class PRD(BaseModel):
    """Product Requirements Document — constrained by founder twin."""

    product_name: str
    problem_statement: str
    target_customer: str
    build_weeks: int
    mvp_features: list[PRDFeature]
    explicitly_excluded: list[PRDFeature]
    exclusion_note: str = Field(..., description="Explains WHY features excluded — references twin constraints")


class MonthlyProjection(BaseModel):
    month: int
    burn_inr: int
    mrr_inr: int
    cumulative_spend_inr: int
    milestone: str


class FinancialModel(BaseModel):
    """Unit economics and runway model — computed from twin's actual numbers."""

    cac_inr: int
    ltv_inr: int
    ltv_cac_ratio: float
    monthly_projections: list[MonthlyProjection]
    break_even_month: int
    capital_recovered_month: int
    verdict: str = Field(..., description="Viable | Marginal | Not viable")


class PitchSlide(BaseModel):
    slide_number: int
    title: str
    content: str
    founder_specific_note: str = Field(..., description="Why this slide is built around THIS founder")


class PitchDeck(BaseModel):
    """7-slide investor pitch — built around founder's actual edge and numbers."""

    slides: list[PitchSlide]
    key_differentiator: str


class TechArchitecture(BaseModel):
    """Tech stack selection — constrained to founder's skills."""

    frontend: str
    backend: str
    ai_layer: str
    database: str
    infra: str
    explicitly_avoided: list[str]
    avoidance_note: str = Field(..., description="Why certain tech was avoided — references twin constraints")


class GitLabIssue(BaseModel):
    title: str
    description: str
    milestone: str
    epic: str
    estimated_hours: int
    labels: list[str]


class GitLabOutput(BaseModel):
    """Real GitLab project created via API."""

    project_url: str
    project_id: int
    milestones_created: list[str]
    epics_created: list[str]
    issues_created: list[GitLabIssue]
    note: str = Field(..., description="Explains how GitLab structure reflects founder profile")


class ExecutionPackage(BaseModel):
    """All five outputs bundled from the execution engine."""

    session_id: str
    prd: PRD
    financial_model: FinancialModel
    pitch_deck: PitchDeck
    tech_architecture: TechArchitecture
    gitlab_output: Optional[GitLabOutput] = None
```

---

## PHASE 2 — BACKEND: CORE ENGINE

### `backend/core/digital_twin.py`

```python
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
from utils.logger import logger
from utils.errors import TwinBuildError

TWIN_INFERENCE_PROMPT = """
You are an expert founder analyst. Given raw answers from a startup founder intake form,
infer a precise FounderProfile JSON object.

RAW INTAKE ANSWERS:
{intake_json}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{{
  "technical_depth": "low|medium|high",
  "execution_velocity": "slow|medium|fast",
  "risk_tolerance": "low|medium-low|medium|medium-high|high",
  "network_strength": "weak|medium|strong",
  "marketing_aptitude": "low|medium|high",
  "competitive_edge": "one sentence describing the founder's genuine edge",
  "blind_spots": ["list of 2-4 specific blind spots"],
  "quit_triggers": ["list from their honest answer"],
  "hard_constraints": {{
    "budget_inr": <integer extracted from their capital answer>,
    "months_to_first_revenue": <integer derived from quit triggers>,
    "team_size": <integer, default 1>,
    "technical_skills": ["list of specific technical skills they mentioned"],
    "no_go_domains": []
  }}
}}

BE PRECISE. DO NOT BE GENEROUS. If they said ₹20,000, budget_inr is 20000.
If they said 6 months, months_to_first_revenue is 6.
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
        prompt = TWIN_INFERENCE_PROMPT.format(intake_json=intake.model_dump_json(indent=2))
        raw_response = await gemini.generate(prompt)
        profile_data = json.loads(raw_response)
        profile = FounderProfile(**profile_data)

        twin = DigitalTwin(
            twin_id=str(uuid.uuid4()),
            raw_intake=intake,
            profile=profile,
            startup_idea=intake.startup_idea,
        )

        logger.info("Digital twin built", extra={"twin_id": twin.twin_id, "edge": profile.competitive_edge})
        return twin

    except json.JSONDecodeError as e:
        logger.error("Gemini returned malformed JSON for twin inference", extra={"error": str(e)})
        raise TwinBuildError("TWIN_INFERENCE_FAILED", "Failed to parse founder profile from intake answers.")
    except Exception as e:
        logger.error("Unexpected error building digital twin", extra={"error": str(e)})
        raise TwinBuildError("TWIN_BUILD_ERROR", str(e))
```

### `backend/core/debate_engine.py`

```python
"""
Module: debate_engine.py
Description: Orchestrates the 3-round structured debate between the 5 executive board agents.
             Round 1: Independent positions. Round 2: Cross-examination. Round 3: Vote.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: agents.*, models.board, models.founder, services.gemini_service
Exports: run_debate
"""

from models.founder import DigitalTwin
from models.board import AgentOpinion, AgentRole, VoteResult, VoteChoice, BoardSession
from agents.ceo_agent import run_ceo_agent
from agents.cfo_agent import run_cfo_agent
from agents.cto_agent import run_cto_agent
from agents.cmo_agent import run_cmo_agent
from agents.cpo_agent import run_cpo_agent
from utils.logger import logger
from utils.errors import DebateError
import asyncio


AGENT_RUNNERS = {
    AgentRole.CEO: run_ceo_agent,
    AgentRole.CFO: run_cfo_agent,
    AgentRole.CTO: run_cto_agent,
    AgentRole.CMO: run_cmo_agent,
    AgentRole.CPO: run_cpo_agent,
}

# CFO cross-examines CEO (budget reality check)
# CTO cross-examines CMO (technical feasibility of growth plans)
# CMO cross-examines CPO (distribution of proposed features)
# CEO cross-examines CFO (market vs cost framing)
# CPO cross-examines CTO (customer needs vs technical complexity)
CROSS_EXAMINATION_PAIRS = [
    (AgentRole.CFO, AgentRole.CEO),
    (AgentRole.CTO, AgentRole.CMO),
    (AgentRole.CMO, AgentRole.CPO),
    (AgentRole.CEO, AgentRole.CFO),
    (AgentRole.CPO, AgentRole.CTO),
]


async def run_debate(session: BoardSession, twin: DigitalTwin) -> BoardSession:
    """
    Execute the full 3-round debate protocol for the board session.

    Round 1: Each agent independently evaluates founder + idea.
    Round 2: Each agent responds to a specific counterpart's Round 1 position.
    Round 3: Each agent casts a final vote after seeing all Round 2 arguments.

    Args:
        session: BoardSession with twin_id and empty rounds list.
        twin: The founder's DigitalTwin providing profile context.

    Returns:
        Updated BoardSession with all 3 rounds populated.

    Raises:
        DebateError: If any agent call fails critically.
    """
    try:
        # === ROUND 1: Independent positions (run in parallel) ===
        logger.info("Debate Round 1 starting", extra={"session_id": session.session_id})
        round_1_tasks = [
            runner(twin=twin, round_num=1, prior_opinions=[])
            for runner in AGENT_RUNNERS.values()
        ]
        round_1_opinions: list[AgentOpinion] = await asyncio.gather(*round_1_tasks)
        session.rounds.append(round_1_opinions)
        logger.info("Round 1 complete", extra={"opinions": len(round_1_opinions)})

        # === ROUND 2: Cross-examination (sequential — each agent sees the prior opinion) ===
        logger.info("Debate Round 2 starting")
        round_2_opinions = []
        for (responder, target) in CROSS_EXAMINATION_PAIRS:
            target_opinion = next(o for o in round_1_opinions if o.agent == target)
            opinion = await AGENT_RUNNERS[responder](
                twin=twin,
                round_num=2,
                prior_opinions=round_1_opinions,
                responding_to_opinion=target_opinion,
            )
            round_2_opinions.append(opinion)
        session.rounds.append(round_2_opinions)
        logger.info("Round 2 complete", extra={"cross_exams": len(round_2_opinions)})

        # === ROUND 3: Final vote (each agent sees ALL Round 1 + Round 2 opinions) ===
        logger.info("Debate Round 3 — voting")
        all_prior = round_1_opinions + round_2_opinions
        round_3_tasks = [
            runner(twin=twin, round_num=3, prior_opinions=all_prior)
            for runner in AGENT_RUNNERS.values()
        ]
        round_3_opinions: list[AgentOpinion] = await asyncio.gather(*round_3_tasks)
        session.rounds.append(round_3_opinions)
        logger.info("Round 3 complete — debate finished")

        session.status = "decided"
        return session

    except Exception as e:
        logger.error("Debate engine failed", extra={"error": str(e), "session_id": session.session_id})
        raise DebateError("DEBATE_FAILED", f"Board debate interrupted: {str(e)}")
```

### `backend/core/decision_synthesizer.py`

```python
"""
Module: decision_synthesizer.py
Description: Synthesizes board debate into a final decision using hard constraint logic.
             Hard constraints are evaluated BEFORE soft scores. CFO budget veto is absolute.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: models.board, models.founder, services.gemini_service
Exports: synthesize_decision
"""

import json
from models.board import BoardSession, BoardDecision, VoteResult, VoteChoice, HardConstraintViolation
from models.founder import DigitalTwin
from services.gemini_service import GeminiService
from utils.logger import logger
from utils.errors import SynthesisError

SYNTHESIS_PROMPT = """
You are the Chairman of an AI executive board. You have just received the complete 3-round 
debate transcript from your board. Your job is to synthesize a final decision.

FOUNDER TWIN PROFILE:
{twin_json}

COMPLETE DEBATE TRANSCRIPT:
{debate_transcript}

DECISION RULES (apply in this strict order):
1. HARD CONSTRAINTS — any violation = REJECT or PIVOT (never PROCEED):
   - If CFO identifies capital runway does not reach first revenue → HARD VETO, must PIVOT
   - If CTO identifies required skills founder doesn't have with no workaround → HARD VETO
   - If time-to-revenue exceeds founder's stated quit threshold → HARD VETO
2. SOFT SCORES — only evaluated if all hard constraints pass:
   - Weight: Market (CEO) 25%, Viability (CFO) 30%, Feasibility (CTO) 20%, Distribution (CMO) 15%, Customer (CPO) 10%
3. PIVOT LOGIC — if original idea is rejected but debate surfaced a better idea, recommend that idea

Return ONLY valid JSON:
{{
  "decision": "PROCEED|PIVOT|REJECT",
  "original_idea": "...",
  "recommended_idea": "...",
  "pivot_reasoning": "one paragraph explaining why this is better for THIS founder specifically",
  "hard_constraint_violations": [
    {{"constraint": "...", "details": "...", "severity": "fatal|warning"}}
  ],
  "votes": [
    {{"agent": "CEO|CFO|CTO|CMO|CPO", "vote": "PROCEED|NO|NEUTRAL", "vote_reason": "..."}}
  ],
  "founder_fit_score": <0-100>,
  "viability_score": <0-100>,
  "overall_score": <0-100>,
  "confidence": <0-100>,
  "key_insight": "one memorable sentence the founder will remember"
}}
"""


async def synthesize_decision(session: BoardSession, twin: DigitalTwin) -> BoardDecision:
    """
    Produce a final BoardDecision from completed debate rounds.

    Hard constraints are checked first. A single CFO budget veto overrides
    any number of optimistic CEO scores. The pivot logic searches debate
    transcripts for emergent ideas and recommends the best fit.

    Args:
        session: BoardSession with 3 completed rounds.
        twin: FounderTwin for constraint evaluation.

    Returns:
        BoardDecision with decision, reasoning, scores, and votes.

    Raises:
        SynthesisError: If synthesis fails or returns invalid JSON.
    """
    gemini = GeminiService()

    try:
        debate_transcript = _format_debate_transcript(session)
        prompt = SYNTHESIS_PROMPT.format(
            twin_json=twin.model_dump_json(indent=2),
            debate_transcript=debate_transcript,
        )
        raw_response = await gemini.generate(prompt)
        decision_data = json.loads(raw_response)
        decision = BoardDecision(**decision_data)

        logger.info(
            "Decision synthesized",
            extra={
                "session_id": session.session_id,
                "decision": decision.decision,
                "overall_score": decision.overall_score,
            },
        )
        return decision

    except json.JSONDecodeError as e:
        logger.error("Synthesis returned malformed JSON", extra={"error": str(e)})
        raise SynthesisError("SYNTHESIS_PARSE_FAILED", "Failed to parse board decision.")
    except Exception as e:
        logger.error("Decision synthesis failed", extra={"error": str(e)})
        raise SynthesisError("SYNTHESIS_ERROR", str(e))


def _format_debate_transcript(session: BoardSession) -> str:
    """
    Format all debate rounds into a readable transcript for the synthesis prompt.

    Args:
        session: BoardSession with completed rounds.

    Returns:
        Formatted string transcript of all rounds.
    """
    lines = []
    for round_idx, round_opinions in enumerate(session.rounds, start=1):
        label = {1: "ROUND 1 — INITIAL POSITIONS", 2: "ROUND 2 — CROSS-EXAMINATION", 3: "ROUND 3 — FINAL VOTE"}
        lines.append(f"\n=== {label.get(round_idx, f'ROUND {round_idx}')} ===")
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
```

---

## PHASE 3 — BACKEND: AGENT IMPLEMENTATIONS

### Agent Template — apply this pattern to all 5 agents

Each agent file follows this exact pattern. CEO is shown in full; implement CFO, CTO, CMO, CPO identically with their own mandates, veto scopes, and prompts.

### `backend/agents/ceo_agent.py`

```python
"""
Module: ceo_agent.py
Description: CEO Agent — focuses on market opportunity, vision, competitive landscape.
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
from utils.logger import logger
from utils.errors import AgentError

CEO_SYSTEM_PROMPT = """
You are the CEO Agent on an AI executive board evaluating startup opportunities.

YOUR MANDATE:
- Market opportunity sizing (TAM/SAM/SOM)
- Competitive landscape assessment  
- Long-term strategic vision
- Timing: why this startup, why now

YOUR CHARACTERISTIC BIAS: You are optimistic about markets. You can be checked by the CFO.
YOUR VETO AUTHORITY: You can veto ideas with no defensible market position.

IMPORTANT: Your reasoning must reference the founder's specific profile — their edge,
constraints, and blind spots. Do not give generic market analysis.
"""

CEO_ROUND_PROMPTS = {
    1: """
FOUNDER TWIN PROFILE:
{twin_json}

STARTUP IDEA: {startup_idea}

This is Round 1. Give your independent position on this founder + idea combination.

Return ONLY valid JSON:
{{
  "reasoning": "2-3 paragraph analysis referencing this founder's specific profile",
  "score": <float 0-10>,
  "concerns": ["list of 2-3 concerns specific to this founder pursuing this idea"],
  "opportunities": ["list of 2-3 genuine opportunities"],
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

This is Round 2. RESPOND SPECIFICALLY to the CFO's concerns about your Round 1 position.
Don't just repeat yourself — either defend your position with new arguments, concede ground,
or propose a modification that addresses the CFO's concern.

Return ONLY valid JSON:
{{
  "reasoning": "direct response to CFO's specific concern, with new arguments",
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

This is Round 3 — your final vote. After seeing all the debate, cast your vote.

Return ONLY valid JSON:
{{
  "reasoning": "final position after full debate — what changed, what didn't, and why",
  "score": <float 0-10>,
  "concerns": ["remaining concerns"],
  "opportunities": ["surviving opportunities"],
  "responding_to": null
}}
"""
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
        twin: Founder's DigitalTwin — all reasoning is filtered through this.
        round_num: Debate round (1, 2, or 3).
        prior_opinions: All opinions from previous rounds for context.
        responding_to_opinion: For Round 2, the specific opinion this agent responds to.

    Returns:
        AgentOpinion with reasoning, score, concerns, and opportunities.

    Raises:
        AgentError: If Gemini call fails or returns malformed JSON.
    """
    gemini = GeminiService()

    try:
        prompt_template = CEO_ROUND_PROMPTS[round_num]
        prompt = prompt_template.format(
            twin_json=twin.model_dump_json(indent=2),
            startup_idea=twin.startup_idea,
            round_1_json=json.dumps([o.model_dump() for o in prior_opinions if o.round == 1], indent=2),
            all_opinions_json=json.dumps([o.model_dump() for o in prior_opinions], indent=2),
            target_opinion_json=responding_to_opinion.model_dump_json(indent=2) if responding_to_opinion else "{}",
        )

        full_prompt = f"{CEO_SYSTEM_PROMPT}\n\n{prompt}"
        raw_response = await gemini.generate(full_prompt)
        opinion_data = json.loads(raw_response)

        opinion = AgentOpinion(
            agent=AgentRole.CEO,
            round=round_num,
            **opinion_data,
        )

        logger.info("CEO agent completed round", extra={"round": round_num, "score": opinion.score})
        return opinion

    except json.JSONDecodeError as e:
        logger.error("CEO agent returned malformed JSON", extra={"round": round_num, "error": str(e)})
        raise AgentError("CEO_PARSE_FAILED", f"CEO agent Round {round_num} parse failed.")
    except Exception as e:
        logger.error("CEO agent failed", extra={"round": round_num, "error": str(e)})
        raise AgentError("CEO_AGENT_ERROR", str(e))
```

**Implement `cfo_agent.py`, `cto_agent.py`, `cmo_agent.py`, `cpo_agent.py` with the same structure.**

CFO Agent specifics:
- Mandate: Unit economics, CAC, LTV, runway math, capital efficiency
- Veto authority: Hard veto if CAC × minimum customers > available budget before first revenue
- Bias: Conservative. The board's immune system against bad math.
- Cross-examines: CEO (market optimism vs cost reality)

CTO Agent specifics:
- Mandate: Technical feasibility, stack selection, build time for solo founder
- Veto authority: Flag ideas requiring skills founder doesn't have without a workaround
- Bias: Underestimates go-to-market complexity
- Cross-examines: CMO (technical feasibility of proposed growth tactics)

CMO Agent specifics:
- Mandate: Customer acquisition, positioning, CAC by channel, network leverage
- Veto authority: Veto go-to-market plans unrealistic for founder's network strength
- Bias: Overestimates organic growth
- Cross-examines: CPO (distribution of proposed features)

CPO Agent specifics:
- Mandate: Problem validation, MVP scope, willingness-to-pay signals, pain depth
- Veto authority: Veto solutions not mapping to specific, validated pain
- Bias: Feature creep
- Cross-examines: CTO (customer needs vs technical complexity)

---

## PHASE 4 — BACKEND: EXECUTION ENGINE

### `backend/core/execution_engine.py`

```python
"""
Module: execution_engine.py
Description: Generates all 5 execution outputs (PRD, Financial Model, Pitch Deck,
             Tech Architecture, GitLab Project) from a completed board decision.
             All outputs are constrained by the founder's DigitalTwin profile.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: services.gemini_service, services.gitlab_service, models.*
Exports: run_execution_engine
"""

import json
import asyncio
from models.founder import DigitalTwin
from models.board import BoardDecision
from models.execution import PRD, FinancialModel, PitchDeck, TechArchitecture, ExecutionPackage
from services.gemini_service import GeminiService
from services.gitlab_service import GitLabService
from utils.logger import logger
from utils.errors import ExecutionError

PRD_PROMPT = """
Generate a Product Requirements Document for this startup.

FOUNDER TWIN (all constraints apply):
{twin_json}

BOARD DECISION:
{decision_json}

The PRD must explicitly reference the founder's constraints. Features must be scoped
for a solo founder with the given budget and timeline. Excluded features must state
WHY they were excluded — referencing the twin's specific constraints.

Return ONLY valid JSON matching the PRD schema:
{{
  "product_name": "...",
  "problem_statement": "...",
  "target_customer": "...",
  "build_weeks": <integer — realistic for this founder's velocity>,
  "mvp_features": [
    {{"name": "...", "description": "...", "priority": "must_have", "exclusion_reason": null}}
  ],
  "explicitly_excluded": [
    {{"name": "...", "description": "...", "priority": "wont_have", "exclusion_reason": "references specific twin constraint"}}
  ],
  "exclusion_note": "paragraph explaining the scope philosophy for this founder"
}}
"""

FINANCIAL_PROMPT = """
Generate a financial model for this startup using the founder's ACTUAL numbers.

FOUNDER TWIN (use their exact budget_inr and months_to_first_revenue):
{twin_json}

BOARD DECISION:
{decision_json}

DO NOT use generic numbers. Use the founder's actual budget. Calculate realistic CAC
based on their network_strength and marketing_aptitude. Project 6 months.

Return ONLY valid JSON:
{{
  "cac_inr": <integer>,
  "ltv_inr": <integer>,
  "ltv_cac_ratio": <float>,
  "monthly_projections": [
    {{"month": 1, "burn_inr": ..., "mrr_inr": ..., "cumulative_spend_inr": ..., "milestone": "..."}}
  ],
  "break_even_month": <integer>,
  "capital_recovered_month": <integer>,
  "verdict": "Viable|Marginal|Not viable"
}}
"""

PITCH_PROMPT = """
Generate a 7-slide investor pitch deck structure.

FOUNDER TWIN:
{twin_json}

BOARD DECISION:
{decision_json}

Each slide must have a "founder_specific_note" explaining why this slide is framed
around THIS founder's specific edge, numbers, or constraints — not generic content.

Return ONLY valid JSON:
{{
  "slides": [
    {{"slide_number": 1, "title": "...", "content": "...", "founder_specific_note": "..."}}
  ],
  "key_differentiator": "one sentence — founder's real unfair advantage"
}}
"""

ARCH_PROMPT = """
Generate a technical architecture recommendation.

FOUNDER TWIN (use their exact technical_skills, budget, and team_size):
{twin_json}

BOARD DECISION:
{decision_json}

Stack must be constrained to what this founder can actually ship. Explicitly avoid
technology requiring skills they don't have or DevOps overhead for a solo founder.

Return ONLY valid JSON:
{{
  "frontend": "...",
  "backend": "...",
  "ai_layer": "...",
  "database": "...",
  "infra": "...",
  "explicitly_avoided": ["list of avoided tech"],
  "avoidance_note": "paragraph explaining WHY each was avoided — references twin constraints"
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

Generate milestones, epics, and issues. Issues must reflect the founder's constraints:
- No issues for features marked wont_have in the PRD
- No DevOps issues if founder is solo with no ops skills
- Estimated hours must be realistic for this founder's velocity

Return ONLY valid JSON:
{{
  "milestones": ["Milestone 1 name", "Milestone 2 name", ...],
  "epics": ["Epic 1 name", "Epic 2 name", ...],
  "issues": [
    {{
      "title": "...",
      "description": "...",
      "milestone": "...",
      "epic": "...",
      "estimated_hours": <integer>,
      "labels": ["backend", "feature", ...]
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

    Runs PRD, financial model, pitch deck, and architecture in parallel.
    GitLab project creation runs sequentially after issues are generated.

    Args:
        twin: Founder's DigitalTwin — all outputs constrained by this.
        decision: BoardDecision from the synthesizer.
        session_id: Session ID for tracking.
        gitlab_token: Optional GitLab personal access token.
        gitlab_namespace: Optional GitLab namespace (username or group).

    Returns:
        ExecutionPackage with all 5 outputs.

    Raises:
        ExecutionError: If any critical output generation fails.
    """
    gemini = GeminiService()

    try:
        twin_json = twin.model_dump_json(indent=2)
        decision_json = decision.model_dump_json(indent=2)

        # Run PRD, financial, pitch, architecture in parallel
        prd_raw, financial_raw, pitch_raw, arch_raw = await asyncio.gather(
            gemini.generate(PRD_PROMPT.format(twin_json=twin_json, decision_json=decision_json)),
            gemini.generate(FINANCIAL_PROMPT.format(twin_json=twin_json, decision_json=decision_json)),
            gemini.generate(PITCH_PROMPT.format(twin_json=twin_json, decision_json=decision_json)),
            gemini.generate(ARCH_PROMPT.format(twin_json=twin_json, decision_json=decision_json)),
        )

        prd = PRD(**json.loads(prd_raw))
        financial_model = FinancialModel(**json.loads(financial_raw))
        pitch_deck = PitchDeck(**json.loads(pitch_raw))
        tech_arch = TechArchitecture(**json.loads(arch_raw))

        logger.info("Parallel outputs generated", extra={"session_id": session_id})

        # Generate GitLab issues structure
        gitlab_issues_raw = await gemini.generate(
            GITLAB_ISSUES_PROMPT.format(
                twin_json=twin_json,
                prd_json=prd.model_dump_json(indent=2),
                arch_json=tech_arch.model_dump_json(indent=2),
            )
        )
        gitlab_issues_data = json.loads(gitlab_issues_raw)

        # Create real GitLab project if token provided
        gitlab_output = None
        if gitlab_token and gitlab_namespace:
            gitlab_svc = GitLabService(token=gitlab_token, namespace=gitlab_namespace)
            gitlab_output = await gitlab_svc.create_project(
                name=prd.product_name,
                description=prd.problem_statement,
                milestones=gitlab_issues_data["milestones"],
                epics=gitlab_issues_data["epics"],
                issues=gitlab_issues_data["issues"],
                note=gitlab_issues_data["note"],
            )
            logger.info("GitLab project created", extra={"url": gitlab_output.project_url})

        return ExecutionPackage(
            session_id=session_id,
            prd=prd,
            financial_model=financial_model,
            pitch_deck=pitch_deck,
            tech_architecture=tech_arch,
            gitlab_output=gitlab_output,
        )

    except json.JSONDecodeError as e:
        logger.error("Execution engine parse failed", extra={"error": str(e)})
        raise ExecutionError("EXECUTION_PARSE_FAILED", "Failed to parse execution output.")
    except Exception as e:
        logger.error("Execution engine failed", extra={"error": str(e)})
        raise ExecutionError("EXECUTION_ERROR", str(e))
```

---

## PHASE 5 — BACKEND: SERVICES

### `backend/services/gemini_service.py`

```python
"""
Module: gemini_service.py
Description: Async wrapper around Google Gemini 2.0 Flash API.
             Handles retries, rate limiting, and JSON extraction.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: google-generativeai, config.env
Exports: GeminiService
"""

import google.generativeai as genai
from config.env import settings
from utils.logger import logger
from utils.errors import GeminiError
import asyncio


class GeminiService:
    """
    Async wrapper for Google Gemini 2.0 Flash.

    Configured with JSON mode enforcement and retry logic.
    All prompts should instruct the model to return ONLY valid JSON.
    """

    MAX_RETRIES = 3
    RETRY_DELAY_SECONDS = 2.0

    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=4096,
                response_mime_type="application/json",
            ),
        )

    async def generate(self, prompt: str) -> str:
        """
        Generate a response from Gemini, with retries.

        Args:
            prompt: Full prompt string including any system context.

        Returns:
            Raw string response from Gemini (expected to be valid JSON).

        Raises:
            GeminiError: If all retries fail.
        """
        for attempt in range(self.MAX_RETRIES):
            try:
                response = await asyncio.to_thread(self._model.generate_content, prompt)
                text = response.text.strip()
                # Strip any accidental markdown fences
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                logger.debug("Gemini response received", extra={"attempt": attempt + 1, "length": len(text)})
                return text.strip()
            except Exception as e:
                logger.warning(f"Gemini attempt {attempt + 1} failed", extra={"error": str(e)})
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.RETRY_DELAY_SECONDS * (attempt + 1))
                else:
                    raise GeminiError("GEMINI_FAILED", f"All {self.MAX_RETRIES} Gemini attempts failed: {str(e)}")
```

### `backend/services/gitlab_service.py`

```python
"""
Module: gitlab_service.py
Description: GitLab REST API v4 integration. Creates projects, milestones, epics, and issues.
             This is the execution layer — transforms board decisions into real infrastructure.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: httpx, config.env, models.execution
Exports: GitLabService
"""

import httpx
from models.execution import GitLabOutput, GitLabIssue
from utils.logger import logger
from utils.errors import GitLabError


class GitLabService:
    """
    Creates a full GitLab project structure from the execution engine's output.

    Creates in order: project → milestones → epics → issues.
    All operations are verified before proceeding to the next step.
    """

    GITLAB_API_BASE = "https://gitlab.com/api/v4"

    def __init__(self, token: str, namespace: str):
        """
        Initialize GitLab service with personal access token.

        Args:
            token: GitLab personal access token with api scope.
            namespace: GitLab username or group name for project placement.
        """
        self._token = token
        self._namespace = namespace
        self._headers = {
            "PRIVATE-TOKEN": token,
            "Content-Type": "application/json",
        }

    async def create_project(
        self,
        name: str,
        description: str,
        milestones: list[str],
        epics: list[str],
        issues: list[dict],
        note: str,
    ) -> GitLabOutput:
        """
        Create a complete GitLab project with milestones, epics, and issues.

        Args:
            name: Project name (will be slugified).
            description: Project description.
            milestones: List of milestone names.
            epics: List of epic names (created as labels + meta issues).
            issues: List of issue dicts from execution engine.
            note: Note explaining how structure reflects founder profile.

        Returns:
            GitLabOutput with project URL and all created items.

        Raises:
            GitLabError: If any critical API call fails.
        """
        async with httpx.AsyncClient() as client:
            # Create project
            project = await self._create_project(client, name, description)
            project_id = project["id"]
            project_url = project["web_url"]
            logger.info("GitLab project created", extra={"url": project_url})

            # Create milestones
            milestone_ids = {}
            for milestone_name in milestones:
                ms = await self._create_milestone(client, project_id, milestone_name)
                milestone_ids[milestone_name] = ms["id"]

            # Create epic labels
            for epic_name in epics:
                await self._create_label(client, project_id, epic_name, color="#6ee7f7")

            # Create issues
            created_issues = []
            for issue_data in issues:
                milestone_id = milestone_ids.get(issue_data.get("milestone"))
                issue = await self._create_issue(
                    client=client,
                    project_id=project_id,
                    title=issue_data["title"],
                    description=issue_data["description"],
                    milestone_id=milestone_id,
                    labels=issue_data.get("labels", []) + [issue_data.get("epic", "")],
                    estimated_hours=issue_data.get("estimated_hours", 0),
                )
                created_issues.append(
                    GitLabIssue(
                        title=issue["title"],
                        description=issue_data["description"],
                        milestone=issue_data.get("milestone", ""),
                        epic=issue_data.get("epic", ""),
                        estimated_hours=issue_data.get("estimated_hours", 0),
                        labels=issue_data.get("labels", []),
                    )
                )

            logger.info(
                "GitLab structure complete",
                extra={"milestones": len(milestone_ids), "issues": len(created_issues)},
            )

            return GitLabOutput(
                project_url=project_url,
                project_id=project_id,
                milestones_created=milestones,
                epics_created=epics,
                issues_created=created_issues,
                note=note,
            )

    async def _create_project(self, client: httpx.AsyncClient, name: str, description: str) -> dict:
        response = await client.post(
            f"{self.GITLAB_API_BASE}/projects",
            headers=self._headers,
            json={
                "name": name,
                "namespace_id": await self._get_namespace_id(client),
                "description": description,
                "visibility": "private",
                "initialize_with_readme": True,
            },
        )
        if response.status_code not in (200, 201):
            raise GitLabError("PROJECT_CREATE_FAILED", f"GitLab project creation failed: {response.text}")
        return response.json()

    async def _get_namespace_id(self, client: httpx.AsyncClient) -> int:
        response = await client.get(
            f"{self.GITLAB_API_BASE}/namespaces",
            headers=self._headers,
            params={"search": self._namespace},
        )
        namespaces = response.json()
        if not namespaces:
            raise GitLabError("NAMESPACE_NOT_FOUND", f"Namespace '{self._namespace}' not found.")
        return namespaces[0]["id"]

    async def _create_milestone(self, client: httpx.AsyncClient, project_id: int, title: str) -> dict:
        response = await client.post(
            f"{self.GITLAB_API_BASE}/projects/{project_id}/milestones",
            headers=self._headers,
            json={"title": title},
        )
        if response.status_code not in (200, 201):
            raise GitLabError("MILESTONE_CREATE_FAILED", f"Milestone creation failed: {response.text}")
        return response.json()

    async def _create_label(self, client: httpx.AsyncClient, project_id: int, name: str, color: str) -> dict:
        response = await client.post(
            f"{self.GITLAB_API_BASE}/projects/{project_id}/labels",
            headers=self._headers,
            json={"name": name, "color": color},
        )
        return response.json()

    async def _create_issue(
        self,
        client: httpx.AsyncClient,
        project_id: int,
        title: str,
        description: str,
        milestone_id: int | None,
        labels: list[str],
        estimated_hours: int,
    ) -> dict:
        body = {
            "title": title,
            "description": f"{description}\n\n**Estimated:** {estimated_hours}h",
            "labels": ",".join(filter(None, labels)),
        }
        if milestone_id:
            body["milestone_id"] = milestone_id
        response = await client.post(
            f"{self.GITLAB_API_BASE}/projects/{project_id}/issues",
            headers=self._headers,
            json=body,
        )
        if response.status_code not in (200, 201):
            raise GitLabError("ISSUE_CREATE_FAILED", f"Issue creation failed: {response.text}")
        return response.json()
```

---

## PHASE 6 — BACKEND: API ROUTERS

### `backend/routers/onboarding.py`

```python
"""
Module: onboarding.py
Description: Onboarding router — accepts intake answers, returns DigitalTwin.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: fastapi, core.digital_twin, services.mongodb_service
Exports: router
"""

from fastapi import APIRouter, HTTPException
from models.founder import OnboardingIntake, DigitalTwin
from core.digital_twin import build_digital_twin
from services.mongodb_service import MongoDBService
from utils.logger import logger
from utils.errors import TwinBuildError

router = APIRouter(prefix="/onboarding", tags=["onboarding"])
db = MongoDBService()


@router.post("/analyze", response_model=DigitalTwin)
async def analyze_intake(intake: OnboardingIntake) -> DigitalTwin:
    """
    Build and persist a DigitalTwin from founder intake answers.

    Args:
        intake: OnboardingIntake with 7 question answers and startup idea.

    Returns:
        DigitalTwin with inferred profile and hard constraints.

    Raises:
        HTTPException 422: If twin inference fails.
    """
    try:
        twin = await build_digital_twin(intake)
        await db.save_twin(twin)
        logger.info("Twin built and saved", extra={"twin_id": twin.twin_id})
        return twin
    except TwinBuildError as e:
        logger.error("Onboarding failed", extra={"error": str(e)})
        raise HTTPException(status_code=422, detail=str(e))
```

### `backend/routers/board.py`

```python
"""
Module: board.py
Description: Board router — starts debate session, streams debate updates via SSE.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: fastapi, core.debate_engine, core.decision_synthesizer
Exports: router
"""

import uuid
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from models.board import BoardSession
from models.founder import DigitalTwin
from core.debate_engine import run_debate
from core.decision_synthesizer import synthesize_decision
from services.mongodb_service import MongoDBService
from utils.logger import logger
from utils.errors import DebateError, SynthesisError

router = APIRouter(prefix="/board", tags=["board"])
db = MongoDBService()


class StartDebateRequest(BaseModel):
    twin_id: str


@router.post("/start", response_model=BoardSession)
async def start_debate(request: StartDebateRequest) -> BoardSession:
    """
    Initialize and run a complete board debate for a given twin.

    Args:
        request: Contains twin_id to load the founder's digital twin.

    Returns:
        Completed BoardSession with all 3 debate rounds and final decision.

    Raises:
        HTTPException 404: If twin not found.
        HTTPException 500: If debate or synthesis fails.
    """
    try:
        twin: DigitalTwin | None = await db.get_twin(request.twin_id)
        if not twin:
            raise HTTPException(status_code=404, detail=f"Twin {request.twin_id} not found")

        session = BoardSession(session_id=str(uuid.uuid4()), twin_id=request.twin_id)
        session = await run_debate(session, twin)
        decision = await synthesize_decision(session, twin)
        session.decision = decision

        await db.save_session(session)
        logger.info("Board session complete", extra={"session_id": session.session_id})
        return session

    except (DebateError, SynthesisError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/stream")
async def stream_debate(session_id: str) -> StreamingResponse:
    """
    Stream debate updates for a session as Server-Sent Events.

    Used by the frontend BoardRoom component to show the debate live.

    Args:
        session_id: The board session ID to stream.

    Returns:
        StreamingResponse with SSE-formatted debate updates.
    """
    async def event_generator():
        session: BoardSession | None = await db.get_session(session_id)
        if not session:
            yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
            return
        for round_idx, round_opinions in enumerate(session.rounds, 1):
            for opinion in round_opinions:
                yield f"data: {opinion.model_dump_json()}\n\n"
        if session.decision:
            yield f"data: {json.dumps({'type': 'decision', 'data': session.decision.model_dump()})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

### `backend/routers/execution.py`

```python
"""
Module: execution.py
Description: Execution router — triggers all 5 output generation from a decided session.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: fastapi, core.execution_engine
Exports: router
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.execution import ExecutionPackage
from core.execution_engine import run_execution_engine
from services.mongodb_service import MongoDBService
from utils.logger import logger
from utils.errors import ExecutionError

router = APIRouter(prefix="/execution", tags=["execution"])
db = MongoDBService()


class RunExecutionRequest(BaseModel):
    session_id: str
    gitlab_token: Optional[str] = None
    gitlab_namespace: Optional[str] = None


@router.post("/run", response_model=ExecutionPackage)
async def run_execution(request: RunExecutionRequest) -> ExecutionPackage:
    """
    Generate all execution outputs for a decided board session.

    Args:
        request: session_id plus optional GitLab credentials.

    Returns:
        ExecutionPackage with PRD, financial model, pitch, architecture, GitLab.

    Raises:
        HTTPException 404: Session not found or not yet decided.
        HTTPException 500: Execution failed.
    """
    try:
        session = await db.get_session(request.session_id)
        if not session or not session.decision:
            raise HTTPException(status_code=404, detail="Session not found or debate not complete")

        twin = await db.get_twin(session.twin_id)
        if not twin:
            raise HTTPException(status_code=404, detail="Founder twin not found")

        package = await run_execution_engine(
            twin=twin,
            decision=session.decision,
            session_id=request.session_id,
            gitlab_token=request.gitlab_token,
            gitlab_namespace=request.gitlab_namespace,
        )

        await db.save_execution_package(package)
        logger.info("Execution complete", extra={"session_id": request.session_id})
        return package

    except ExecutionError as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### `backend/main.py`

```python
"""
Module: main.py
Description: FastAPI application entry point. Mounts all routers and configures CORS.

Author:  KAIRON / Founder Twin
Created: 2025-06-09

Dependencies: fastapi, routers.*
Exports: app
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import onboarding, board, execution
from config.env import settings
from utils.logger import logger

app = FastAPI(
    title="Founder Twin API",
    description="AI Executive Board for founder-specific startup building",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(onboarding.router)
app.include_router(board.router)
app.include_router(execution.router)


@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run."""
    return {"status": "healthy", "service": "founder-twin-api"}


@app.on_event("startup")
async def startup():
    logger.info("Founder Twin API starting", extra={"env": settings.environment})
```

---

## PHASE 7 — FRONTEND: LANDING PAGE

Build a **dark-futuristic** Next.js 14 landing page using the skill specification.

**Visual identity:**
- Tone: `dark-futuristic`
- `--bg: #05050a` / `--accent: #6ee7f7` / `--accent-2: #a78bfa`
- Fonts: Syne (display) + DM Sans (body)
- 3D centerpiece: A slowly rotating icosahedron with inner glow — representing the "founder orb" / digital twin awakening. Surrounded by 5 orbiting smaller nodes (the board agents).

**Sections required (in order):**

### Hero Section
```
Headline: "Your AI Executive Board. Built Around You."
Subline: "Founder Twin creates a digital model of your skills, budget, and constraints — 
          then assembles a board of 5 AI agents that debate, overrule each other, 
          and build your startup from scratch."
CTA: "Build My Twin" → /onboarding
Secondary: "Watch the Demo" → scrolls to HowItWorks
Background: 3D scene — rotating icosahedron orb + 5 orbiting agent nodes + particle field
```

### How It Works Section (3 steps with inline SVG)
```
Step 1: "Answer 7 Questions"
        Your digital twin is built from your honest answers — 
        not a form, but an intelligence model.

Step 2: "The Board Debates"  
        5 AI agents — CEO, CFO, CTO, CMO, CPO — run a 3-round structured debate.
        They can veto your idea. They might find a better one.

Step 3: "Your Company Is Built"
        GitLab project. Sprint issues. Pitch deck. Financial model.
        Tailored to you, not a template.
```

### Features Section (5 GlowCards — one per agent)
```
CEO Agent — Market Opportunity
CFO Agent — Budget Reality Check  
CTO Agent — Technical Feasibility
CMO Agent — Distribution Strategy
CPO Agent — Customer Validation
```

### Pivot Moment Section (the emotional peak)
```
Headline: "The Board Will Overrule You. That's the Point."
Content: Show a mock debate card sequence:
  User: "I want to build an EdTech AI platform"
  CFO: "Hard constraint violated — CAC exceeds runway"
  Board: Unanimous pivot
  System: "Here is a better idea for you specifically"
This should be animated — cards appearing one by one with Framer Motion
```

### Footer
```
KAIRON — Founder Twin
Links: GitHub, Devpost, LinkedIn
Tagline: "An AI executive board that builds startups tailored to the founder, not just the idea."
```

---

## PHASE 8 — FRONTEND: ONBOARDING FLOW

### `app/onboarding/page.tsx`

7-question conversational intake. One question at a time. Animated transitions.

```typescript
const QUESTIONS = [
  {
    id: "what_can_you_build",
    question: "What can you build right now, today, without learning anything new?",
    hint: "Be specific — list actual technologies, frameworks, or skills.",
    placeholder: "e.g. Next.js frontends, FastAPI backends, Gemini-based AI features..."
  },
  {
    id: "capital_available",
    question: "How much capital can you deploy in the next 6 months?",
    hint: "Be honest. Include everything — savings, side income, family support.",
    placeholder: "e.g. ₹50,000 total"
  },
  {
    id: "what_makes_you_quit",
    question: "What would make you quit — be honest.",
    hint: "No revenue after X months? Running out of money? Loneliness?",
    placeholder: "e.g. If I'm still at zero users after 5 months, I'd walk away"
  },
  {
    id: "first_potential_customer",
    question: "Name one person you could call tomorrow who might pay for something you built.",
    hint: "This tests your network. A real person, not a vague demographic.",
    placeholder: "e.g. My uncle who runs a coaching institute in Mysore"
  },
  {
    id: "hardest_thing_shipped",
    question: "What's the hardest thing you've ever shipped? How long did it take?",
    hint: "This tells us your execution velocity.",
    placeholder: "e.g. Built a full healthcare platform in 3 weeks for Imagine Cup"
  },
  {
    id: "draining_work",
    question: "What kind of work drains you even when you're good at it?",
    hint: "This reveals your blind spots — things you'll avoid under stress.",
    placeholder: "e.g. Cold calling, writing long-form content, managing spreadsheets"
  },
  {
    id: "most_likely_failure",
    question: "If this fails in 12 months, what's the most likely reason?",
    hint: "Honest self-awareness here is your most powerful startup tool.",
    placeholder: "e.g. I'll over-engineer the product and never talk to customers"
  },
]
```

After Q7, ask for the startup idea:
```
"Now tell the board your idea."
placeholder: "e.g. I want to build an AI platform for farmers in Karnataka"
```

On submit: POST to `/onboarding/analyze` → show animated twin-building sequence → redirect to `/board?twin_id=...`

---

## PHASE 9 — FRONTEND: BOARD ROOM

### `app/board/page.tsx`

The debate UI. This is the most important screen — it IS the demo.

**Layout:**
```
Top: DebateTimeline (Round 1 → Round 2 → Round 3 → Decision)
Left: 5 AgentCards (CEO, CFO, CTO, CMO, CPO) — light up when active
Center: Live debate feed — opinions appearing one by one with animation
Right: FounderTwin panel — shows twin profile being referenced in real time
Bottom: VoteDisplay + PivotMoment reveal
```

**AgentCard component — per agent:**
```
- Avatar: Unique inline SVG icon per agent (not emoji)
- Name: "CEO Agent"
- Role: "Market Opportunity"
- Status badge: "Thinking..." | "Speaking" | "Voted: PROCEED/NO/NEUTRAL"
- Last statement preview (truncated)
- Score displayed as a glowing number when revealed
```

**PivotMoment component:**
- Only renders if `decision.decision === "PIVOT"`
- Animated reveal with full-screen overlay
- Shows: original idea → board rejection reason → recommended pivot → why it fits this founder
- This is the emotional peak of the demo — make it cinematic

**Use SSE streaming** from `/board/{session_id}/stream` to show debate in real time.

---

## PHASE 10 — FRONTEND: RESULTS PAGE

### `app/results/page.tsx`

5-panel tabbed interface:

```
Tabs: [Startup Decision] [PRD] [Financials] [Pitch Deck] [GitLab]
```

**[Startup Decision]:** Decision banner (PROCEED/PIVOT/REJECT in large type), all 5 votes displayed, key insight quote from board, founder fit score, viability score.

**[PRD]:** Feature table (must-have / should-have / won't-have) with exclusion reasons shown inline. The exclusion_note prominently displayed — "Why we scoped this for YOU."

**[Financials]:** Month-by-month projection table + LTV:CAC ratio prominently displayed. Verdict badge (Viable / Marginal / Not viable).

**[Pitch Deck]:** 7 slide cards. Each card shows `founder_specific_note` — making it clear this pitch is built around the founder's actual edge.

**[GitLab]:** If created — show project URL as a clickable badge, milestone timeline, issue count by epic. Note displayed: "How this structure reflects your profile." If not created — show CTA to connect GitLab credentials.

---

## PHASE 11 — ENVIRONMENT VARIABLES

### `.env.example`

```bash
# Google Gemini
GEMINI_API_KEY=

# MongoDB Atlas
MONGODB_URI=
MONGODB_DB_NAME=founder_twin

# GitLab (optional — for real project creation)
# Users provide their own token at runtime via the results page
# These are optional server-side defaults for demo purposes
GITLAB_DEFAULT_TOKEN=
GITLAB_DEFAULT_NAMESPACE=

# Next.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Backend URL (used by frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Environment
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000
```

---

## PHASE 12 — TESTS

### `backend/tests/test_digital_twin.py`

```python
"""
Module: test_digital_twin.py
Description: Unit tests for digital twin inference.

Author:  KAIRON / Founder Twin
Created: 2025-06-09
"""

import pytest
from unittest.mock import AsyncMock, patch
from models.founder import OnboardingIntake
from core.digital_twin import build_digital_twin

MOCK_INTAKE = OnboardingIntake(
    what_can_you_build="Next.js, FastAPI, Gemini AI features",
    capital_available="₹50,000 total",
    what_makes_you_quit="No revenue after 5 months",
    first_potential_customer="Uncle who runs a coaching institute",
    hardest_thing_shipped="Full healthcare platform in 3 weeks",
    draining_work="Cold calling and enterprise sales",
    most_likely_failure="Over-engineer and never talk to customers",
    startup_idea="AI CRM for coaching institutes",
)

MOCK_GEMINI_RESPONSE = """{
  "technical_depth": "high",
  "execution_velocity": "fast",
  "risk_tolerance": "medium-low",
  "network_strength": "weak",
  "marketing_aptitude": "low",
  "competitive_edge": "Can ship AI products faster than most solo founders",
  "blind_spots": ["enterprise sales", "cold outreach", "pricing psychology"],
  "quit_triggers": ["no revenue after 5 months"],
  "hard_constraints": {
    "budget_inr": 50000,
    "months_to_first_revenue": 5,
    "team_size": 1,
    "technical_skills": ["Next.js", "FastAPI", "Gemini"],
    "no_go_domains": []
  }
}"""


@pytest.mark.asyncio
async def test_build_digital_twin_happy_path():
    """Twin is correctly built from valid intake answers."""
    with patch("core.digital_twin.GeminiService") as MockGemini:
        instance = MockGemini.return_value
        instance.generate = AsyncMock(return_value=MOCK_GEMINI_RESPONSE)
        twin = await build_digital_twin(MOCK_INTAKE)
        assert twin.profile.technical_depth == "high"
        assert twin.profile.hard_constraints.budget_inr == 50000
        assert twin.twin_id is not None


@pytest.mark.asyncio
async def test_build_digital_twin_extracts_budget_correctly():
    """Budget is extracted as integer, not string."""
    with patch("core.digital_twin.GeminiService") as MockGemini:
        instance = MockGemini.return_value
        instance.generate = AsyncMock(return_value=MOCK_GEMINI_RESPONSE)
        twin = await build_digital_twin(MOCK_INTAKE)
        assert isinstance(twin.profile.hard_constraints.budget_inr, int)
        assert twin.profile.hard_constraints.budget_inr == 50000


@pytest.mark.asyncio
async def test_build_digital_twin_raises_on_malformed_json():
    """TwinBuildError raised when Gemini returns invalid JSON."""
    from utils.errors import TwinBuildError
    with patch("core.digital_twin.GeminiService") as MockGemini:
        instance = MockGemini.return_value
        instance.generate = AsyncMock(return_value="not json at all {{{")
        with pytest.raises(TwinBuildError):
            await build_digital_twin(MOCK_INTAKE)
```

Write `test_debate_engine.py`, `test_decision_synthesizer.py`, and `test_gitlab_service.py` with the same pattern — 3 tests each: happy path, edge case, error path.

---

## PHASE 13 — README

```markdown
# Founder Twin — AI Executive Board

> An AI executive board that builds startups tailored to the founder, not just the idea.

Built by KAIRON | Team ERROR_404_NOT_FOUND | Hackathon Submission

## The Core Insight

Most startup tools build plans around *ideas*. Founder Twin builds plans around *founders*.
It creates a digital model of your skills, capital, and constraints — then runs a 5-agent
board that debates your idea through the lens of your specific reality.

## Problem Statement

Startup failure is rarely about bad ideas. It's about founder-idea mismatch: the plan
didn't account for the founder's actual skills, budget, or blind spots. No existing tool
solves this — they all produce generic plans regardless of who the founder is.

## Solution Architecture

```
Founder Intake (7 questions) 
  → Digital Twin (inferred profile + hard constraints)
    → Executive Board (5 agents, 3-round debate) 
      → Decision Synthesizer (hard constraints first)
        → Execution Engine (PRD + Financials + Pitch + GitLab)
```

## Key Differentiator: The Pivot Moment

The board can — and will — overrule the founder's original idea when hard constraints
are violated. The system surfaces a better-fit idea from debate and presents it with
full reasoning. This is what no other tool does.

## Features

- **Digital Twin**: 7-question intake → inferred founder profile with hard constraints
- **Executive Board**: CEO, CFO, CTO, CMO, CPO agents with defined mandates and veto authority
- **Real Debate**: 3-round protocol (positions → cross-examination → vote) — not parallel generation
- **Decision Synthesizer**: Hard constraints checked before soft scores; reasoned rejection/pivot
- **PRD Generation**: Scoped to founder's velocity, budget, and skills with explicit exclusion reasoning
- **Financial Model**: Real numbers — founder's actual budget, realistic CAC, 6-month projections
- **Pitch Deck**: Built around founder's specific edge, not a template
- **GitLab Integration**: Real project with milestones, epics, and sprint issues via GitLab API v4

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber |
| Backend | FastAPI, Python 3.11, async |
| LLM | Google Gemini 2.0 Flash |
| Agent Orchestration | LangGraph |
| Database | MongoDB Atlas |
| GitLab | REST API v4 |
| Deployment | Vercel + Google Cloud Run |

## Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/founder-twin
cd founder-twin

# Backend
cd backend
cp ../.env.example .env
# Fill in GEMINI_API_KEY, MONGODB_URI
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd ../frontend
cp ../.env.example .env.local
# Fill in NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| GEMINI_API_KEY | Google AI Studio API key | Yes |
| MONGODB_URI | MongoDB Atlas connection string | Yes |
| NEXTAUTH_SECRET | NextAuth random secret | Yes |
| GOOGLE_CLIENT_ID | Google OAuth client ID | Yes |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret | Yes |
| GITLAB_DEFAULT_TOKEN | GitLab PAT for demo (api scope) | No |
| GITLAB_DEFAULT_NAMESPACE | GitLab username/group | No |

## Demo Script (3 minutes)

1. Open app → landing page with 3D orb scene
2. Click "Build My Twin" → onboarding (7 questions, real answers)
3. Submit → twin builds → redirect to board room
4. Board room: watch all 5 agents debate in real time (SSE streaming)
5. CFO vetoes original idea → pivot emerges → board votes unanimously
6. Results page: PRD, financials, pitch deck — all showing twin's actual constraints
7. GitLab: click project URL → real project, real issues, real milestones

## Assumptions

- Gemini 2.0 Flash is used for all agent calls (cost-efficient for hackathon demo)
- GitLab project creation requires user's own personal access token
- Financial projections are AI-generated estimates, not financial advice

## License

MIT — KAIRON 2025
```

---

## CODE QUALITY RULES (apply to every file)

1. Every file starts with the documented header comment
2. Every function has JSDoc (TypeScript) or Google-style docstring (Python)
3. All external inputs validated with Pydantic (Python) or Zod (TypeScript)
4. Structured logger used everywhere — no `console.log` or `print()`
5. Custom error classes per module — never throw raw strings
6. All env vars validated at startup via `config/env.py` (Pydantic Settings)
7. Minimum 3 pytest tests per core function
8. No magic numbers — all constants in `config/constants.py`
9. Single responsibility per file — one class or one family of functions
10. No hardcoded API keys anywhere in source

---

## BUILD ORDER

Execute phases in this order:

```
1. Backend models (founder.py, board.py, execution.py)
2. Backend config (env.py, constants.py)
3. Backend utils (logger.py, errors.py)
4. Backend services (gemini_service.py, mongodb_service.py, gitlab_service.py)
5. Backend core (digital_twin.py, debate_engine.py, decision_synthesizer.py, execution_engine.py)
6. Backend agents (all 5, using CEO template)
7. Backend routers (onboarding.py, board.py, execution.py)
8. Backend main.py + tests
9. Frontend: package.json, globals.css, tailwind.config.ts, layout.tsx
10. Frontend: 3D components (Scene, FounderOrb, Particles)
11. Frontend: landing page sections (Hero, HowItWorks, Features, PivotMoment, Footer)
12. Frontend: onboarding/page.tsx
13. Frontend: board/page.tsx + all board components
14. Frontend: results/page.tsx + all result panels
15. .env.example + README.md
```

---

## DEMO MOMENT — THE LINE THAT WINS THE ROOM

When the board overrules the founder:

> *"Your original idea was rejected. Here is a better one — built for you specifically."*
>
> GitLab project appears. Real. Clickable. Alive.
>
> *"Founder Twin doesn't generate startup plans. It tells you the truth about your startup — then builds it anyway."*   
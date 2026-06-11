from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime


class OnboardingIntake(BaseModel):
    """Raw answers from the 7-question conversational intake."""

    what_can_you_build: str = Field(..., description="Skills the founder has right now")
    capital_available: str = Field(..., description="Capital they can deploy in 6 months")
    what_makes_you_quit: str = Field(..., description="Honest quit triggers")
    first_potential_customer: str = Field(..., description="Someone who would pay tomorrow")
    hardest_thing_shipped: str = Field(..., description="Hardest shipped project + timeline")
    draining_work: str = Field(..., description="Work that drains them despite competence")
    most_likely_failure: str = Field(..., description="Most likely reason this fails in 12 months")

class HardConstraints(BaseModel):
    """Non-negotiable constraints extracted from founder profile."""

    budget_inr: int = Field(..., description="Total available capital in INR")
    months_to_first_revenue: Optional[int] = Field(default=None, description="Max months before needing revenue")
    team_size: int = Field(default=1, description="Number of founders/team members")
    technical_skills: list[str] = Field(default_factory=list)
    no_go_domains: list[str] = Field(default_factory=list, description="Domains founder refuses")

    @field_validator('technical_skills', 'no_go_domains', mode='before')
    @classmethod
    def ensure_list(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [v]
        return v



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

    @field_validator('blind_spots', 'quit_triggers', mode='before')
    @classmethod
    def ensure_list(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [v]
        return v


class DigitalTwin(BaseModel):
    """The living digital representation of the founder."""

    twin_id: str
    user_id: Optional[str] = None
    founder_name: Optional[str] = None
    raw_intake: OnboardingIntake
    profile: FounderProfile
    startup_idea: Optional[str] = None
    session_count: int = 0
    evolution_log: list[str] = Field(
        default_factory=list,
        description="How twin changed over sessions",
    )
    # Crawl enrichment
    last_crawled_at: Optional[datetime] = Field(
        default=None,
        description="When the public profile crawler last ran for this twin",
    )
    crawl_insights: list[str] = Field(
        default_factory=list,
        description="Key insights discovered by the profile crawler",
    )

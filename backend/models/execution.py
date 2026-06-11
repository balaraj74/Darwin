"""
Module: execution.py
Description: Pydantic models for all execution engine outputs.

Author:  Balaraj
Created: 2026-06-10

Dependencies: pydantic
Exports: PRD, FinancialModel, PitchDeck, TechArchitecture, GitLabOutput, ExecutionPackage
"""

from pydantic import BaseModel, Field
from typing import Optional


class PRDFeature(BaseModel):
    name: str
    description: str
    priority: str = Field(..., description="must_have | should_have | wont_have")
    exclusion_reason: Optional[str] = Field(
        None, description="Why excluded — links to twin constraints"
    )


class PRD(BaseModel):
    """Product Requirements Document — constrained by founder twin."""

    product_name: str
    problem_statement: str
    target_customer: str
    build_weeks: int
    mvp_features: list[PRDFeature]
    explicitly_excluded: list[PRDFeature]
    exclusion_note: str = Field(
        ..., description="Explains WHY features excluded — references twin constraints"
    )


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
    founder_specific_note: str = Field(
        ..., description="Why this slide is built around THIS founder"
    )


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
    avoidance_note: str = Field(
        ..., description="Why certain tech was avoided — references twin constraints"
    )


class GitLabIssue(BaseModel):
    iid: Optional[int] = None
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
    engineering_status: str = Field("pending", description="pending | in_progress | completed | failed")
    engineering_error: Optional[str] = None
    engineering_logs: list[str] = Field(default_factory=list)


class ExecutionPackage(BaseModel):
    """All five outputs bundled from the execution engine."""

    session_id: str
    prd: PRD
    financial_model: FinancialModel
    pitch_deck: PitchDeck
    tech_architecture: TechArchitecture
    gitlab_output: Optional[GitLabOutput] = None

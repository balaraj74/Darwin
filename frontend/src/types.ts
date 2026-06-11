/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Onboarding and Founder Profile Types
export interface OnboardingIntake {
  what_can_you_build: string;
  capital_available: string;
  what_makes_you_quit: string;
  first_potential_customer: string;
  hardest_thing_shipped: string;
  draining_work: string;
  most_likely_failure: string;
  startup_idea: string;
}

export interface HardConstraints {
  budget_inr: number;
  months_to_first_revenue: number;
  team_size: number;
  technical_skills: string[];
  no_go_domains: string[];
}

export interface FounderProfile {
  technical_depth: "low" | "medium" | "high";
  execution_velocity: "slow" | "medium" | "fast";
  risk_tolerance: "low" | "medium-low" | "medium" | "medium-high" | "high";
  network_strength: "weak" | "medium" | "strong";
  marketing_aptitude: "low" | "medium" | "high";
  competitive_edge: string;
  blind_spots: string[];
  quit_triggers: string[];
  hard_constraints: HardConstraints;
}

export interface DigitalTwin {
  twin_id: string;
  user_id?: string;
  founder_name?: string;
  raw_intake: OnboardingIntake;
  profile: FounderProfile;
  startup_idea: string;
  session_count: number;
  evolution_log?: string[];
  last_crawled_at?: string;
  crawl_insights?: string[];
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  instagram?: string;
  portfolio?: string;
  twitter?: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  display_name?: string;
  bio?: string;
  profile_photo_b64?: string;
  social_links: SocialLinks;
  gitlab_token?: string;
  gitlab_namespace?: string;
  last_crawled_at?: string;
}

// Board Debate and Decision Types
export type AgentRole = "CEO" | "CFO" | "CTO" | "CMO" | "CPO";
export type VoteChoice = "PROCEED" | "NO" | "NEUTRAL";

export interface AgentOpinion {
  agent: AgentRole;
  round: number;
  reasoning: string;
  score: number;
  concerns: string[];
  opportunities: string[];
  responding_to?: AgentRole;
}

export interface VoteResult {
  agent: AgentRole;
  vote: VoteChoice;
  vote_reason: string;
}

export interface HardConstraintViolation {
  constraint: string;
  details: string;
  severity: "fatal" | "warning";
}

export interface BoardDecision {
  decision: "PROCEED" | "PIVOT" | "REJECT";
  original_idea: string;
  recommended_idea: string;
  pivot_reasoning?: string;
  hard_constraint_violations: HardConstraintViolation[];
  votes: VoteResult[];
  founder_fit_score: number;
  viability_score: number;
  overall_score: number;
  confidence: number;
  key_insight: string;
}

export interface BoardSession {
  session_id: string;
  twin_id: string;
  rounds: AgentOpinion[][];
  decision?: BoardDecision;
  status: "pending" | "debating" | "decided" | "executed";
}

// Execution and Deliverable Types
export interface PRDFeature {
  name: string;
  description: string;
  priority: "must_have" | "should_have" | "wont_have";
  exclusion_reason?: string;
}

export interface PRD {
  product_name: string;
  problem_statement: string;
  target_customer: string;
  build_weeks: number;
  mvp_features: PRDFeature[];
  explicitly_excluded: PRDFeature[];
  exclusion_note: string;
}

export interface MonthlyProjection {
  month: number;
  burn_inr: number;
  mrr_inr: number;
  cumulative_spend_inr: number;
  milestone: string;
}

export interface FinancialModel {
  cac_inr: number;
  ltv_inr: number;
  ltv_cac_ratio: number;
  monthly_projections: MonthlyProjection[];
  break_even_month: number;
  capital_recovered_month: number;
  verdict: "Viable" | "Marginal" | "Not viable";
}

export interface PitchSlide {
  slide_number: number;
  title: string;
  content: string;
  founder_specific_note: string;
}

export interface PitchDeck {
  slides: PitchSlide[];
  key_differentiator: string;
}

export interface TechArchitecture {
  frontend: string;
  backend: string;
  ai_layer: string;
  database: string;
  infra: string;
  explicitly_avoided: string[];
  avoidance_note: string;
}

export interface GitLabIssue {
  title: string;
  description: string;
  milestone: string;
  epic: string;
  estimated_hours: number;
  labels: string[];
}

export interface GitLabOutput {
  project_url: string;
  project_id: number;
  milestones_created: string[];
  epics_created: string[];
  issues_created: GitLabIssue[];
  note: string;
}

export interface ExecutionPackage {
  session_id: string;
  prd: PRD;
  financial_model: FinancialModel;
  pitch_deck: PitchDeck;
  tech_architecture: TechArchitecture;
  gitlab_output?: GitLabOutput;
}

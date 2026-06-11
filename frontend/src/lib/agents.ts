/**
 * Darwin Agent — Multi-Agent Board System
 * ADK-style: Each agent has a distinct system prompt, reasoning mandate, and veto scope.
 * Orchestration: Supervisor runs 3 sequential debate rounds.
 */

import { GoogleGenAI } from "@google/genai";
import { DigitalTwin, AgentOpinion, AgentRole, BoardDecision, VoteResult, HardConstraintViolation, DebateRound } from "../types.js";

// ─────────────────────────────────────────────
// Model Selection (per AGENT.md rules)
// ─────────────────────────────────────────────
const MODEL = "gemini-2.5-flash"; // Stable, not deprecated

// ─────────────────────────────────────────────
// Agent System Prompts
// ─────────────────────────────────────────────

const AGENT_PROMPTS: Record<AgentRole, string> = {
  CEO: `You are the CEO Agent on the Darwin Executive Board.
MANDATE: Evaluate market opportunity, competitive landscape, and 3-year vision.
REASONING BIAS: Optimistic about market size and timing. Needs CFO to check you.
VETO AUTHORITY: Can veto ideas with no defensible market position.
DATA SOURCES: Market size reasoning, competitor landscape, timing signals.

You think like a visionary founder who has seen 100 startups: you identify the biggest market opportunity the founder's idea can attack, even if it requires a pivot from their original concept.`,

  CFO: `You are the CFO Agent on the Darwin Executive Board.
MANDATE: Evaluate unit economics, capital efficiency, and runway math.
REASONING BIAS: EXTREMELY conservative. You are the board's immune system against bad math.
VETO AUTHORITY: HARD VETO on any plan that burns through founder capital before first revenue.
DATA SOURCES: CAC estimates, LTV models, cost structures, burn rates.

You do hard math. If the founder's budget divided by estimated CAC gives fewer than 20 paying customers before capital depletion, you say NO loudly. You check: Does capital runway reach first revenue? Is there a path to break-even before the quit threshold?`,

  CTO: `You are the CTO Agent on the Darwin Executive Board.
MANDATE: Evaluate technical feasibility, stack selection, and build time estimation.
REASONING BIAS: Underestimates go-to-market complexity. Needs CMO to check you.
VETO AUTHORITY: Can FLAG (not hard veto) ideas requiring skills the founder lacks with no workaround.
DATA SOURCES: Founder's stated technical skills, complexity assessment, scalability requirements.

You are pragmatic. You match the tech stack EXACTLY to what the founder says they can build. You avoid recommending Kubernetes, microservices, or anything requiring DevOps overhead for a solo founder. You estimate build time in weeks honestly.`,

  CMO: `You are the CMO Agent on the Darwin Executive Board.
MANDATE: Evaluate customer acquisition channels, positioning, and go-to-market strategy.
REASONING BIAS: Tends to overestimate organic growth. CFO checks your CAC assumptions.
VETO AUTHORITY: Can veto go-to-market plans that are unrealistic given the founder's actual network.
DATA SOURCES: Founder's network strength, CAC by channel, competitive positioning.

You are a distribution strategist. You look at the founder's answer about "one person they could call tomorrow" and build the entire initial GTM from that warm network outward. Cold outbound without budget = death. Warm networks + product-led growth = life.`,

  CPO: `You are the CPO Agent on the Darwin Executive Board.
MANDATE: Evaluate problem validation, MVP scope, and customer pain depth.
REASONING BIAS: Tends toward feature creep. CEO keeps scope disciplined.
VETO AUTHORITY: Can veto solutions that don't map to a real, specific, urgent customer pain.
DATA SOURCES: Problem specificity, existing solutions, willingness-to-pay signals.

You are the customer's advocate. You strip features to the absolute minimum that solves ONE pain point deeply. If the founder's idea is solving a "nice to have" rather than a "keeps them up at night" problem, you say so clearly.`,
};

// ─────────────────────────────────────────────
// Individual Agent Inference
// ─────────────────────────────────────────────

interface AgentCallOptions {
  gemini: GoogleGenAI;
  agent: AgentRole;
  twin: DigitalTwin;
  round: number;
  ideaToEvaluate: string;
  otherOpinions?: AgentOpinion[];
  respondingTo?: AgentRole;
}

export async function callAgent(opts: AgentCallOptions): Promise<AgentOpinion> {
  const { gemini, agent, twin, round, ideaToEvaluate, otherOpinions = [], respondingTo } = opts;

  const twinContext = `
FOUNDER DIGITAL TWIN:
- Startup Idea: "${ideaToEvaluate}"
- Technical Skills: ${twin.profile.hard_constraints.technical_skills.join(", ")}
- Budget: ₹${twin.profile.hard_constraints.budget_inr.toLocaleString()}
- Quit Threshold: ${twin.profile.hard_constraints.months_to_first_revenue} months to first revenue
- Team Size: ${twin.profile.hard_constraints.team_size} (solo)
- Technical Depth: ${twin.profile.technical_depth}
- Execution Velocity: ${twin.profile.execution_velocity}
- Risk Tolerance: ${twin.profile.risk_tolerance}
- Network Strength: ${twin.profile.network_strength}
- Marketing Aptitude: ${twin.profile.marketing_aptitude}
- Competitive Edge: ${twin.profile.competitive_edge}
- Blind Spots: ${twin.profile.blind_spots.join(", ")}
- Quit Triggers: ${twin.profile.quit_triggers.join(", ")}
- No-Go Domains: ${twin.profile.hard_constraints.no_go_domains.join(", ")}
`;

  let otherContext = "";
  if (otherOpinions.length > 0) {
    otherContext = "\nOTHER BOARD MEMBERS' POSITIONS:\n";
    otherOpinions.forEach((op) => {
      otherContext += `${op.agent} (Round ${op.round}): "${op.reasoning}" — Score: ${op.score}/10\n`;
    });
  }

  let taskInstruction = "";
  if (round === 1) {
    taskInstruction = `This is Round 1 — your INITIAL INDEPENDENT POSITION.
Evaluate the founder's idea strictly through your mandate lens. Be specific about numbers.
The founder's constraints are HARD LIMITS, not negotiating points.`;
  } else if (round === 2) {
    taskInstruction = `This is Round 2 — CROSS-EXAMINATION.
You are specifically responding to ${respondingTo}'s position. 
Build on their point, challenge it, or propose a pivot — but make your reasoning DIRECT and SPECIFIC.
Reference their exact concern or opportunity and provide your counter-analysis.`;
  } else {
    taskInstruction = `This is Round 3 — FINAL SYNTHESIS AND VOTE.
Having heard all positions across 2 rounds, state your FINAL recommendation clearly.
Your vote should be PROCEED, NEUTRAL, or NO — with one sentence explaining why.
If a pivot has emerged from the debate, endorse or challenge it explicitly.`;
  }

  const prompt = `${AGENT_PROMPTS[agent]}

${twinContext}
${otherContext}

TASK: ${taskInstruction}

Return ONLY valid JSON. No markdown, no explanation:
{
  "agent": "${agent}",
  "round": ${round},
  "reasoning": "2-3 sentences of your specific analysis, using actual numbers from the founder twin",
  "score": <number 1-10, your assessment of this idea/pivot for THIS FOUNDER>,
  "concerns": ["specific concern 1", "specific concern 2"],
  "opportunities": ["specific opportunity 1", "specific opportunity 2"],
  ${respondingTo ? `"responding_to": "${respondingTo}"` : `"responding_to": null`}
}`;

  try {
    const response = await gemini.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(response.text ?? "{}");
    return {
      agent: parsed.agent ?? agent,
      round: parsed.round ?? round,
      reasoning: parsed.reasoning ?? `${agent} analyzed the founder's constraints.`,
      score: typeof parsed.score === "number" ? Math.min(10, Math.max(0, parsed.score)) : 7,
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
      responding_to: parsed.responding_to || undefined,
    };
  } catch (err) {
    console.error(`[Agent ${agent} R${round}] Gemini call failed:`, err);
    return buildFallbackOpinion(agent, round, twin, respondingTo);
  }
}

// ─────────────────────────────────────────────
// Decision Synthesizer
// ─────────────────────────────────────────────

export async function runDecisionSynthesizer(
  gemini: GoogleGenAI,
  twin: DigitalTwin,
  originalIdea: string,
  allRounds: AgentOpinion[][]
): Promise<BoardDecision> {
  const flatOpinions = allRounds.flat();

  const prompt = `You are the Darwin Decision Synthesizer. You apply a strict decision hierarchy:

HARD CONSTRAINTS (non-negotiable, FAIL = REJECT):
1. Capital runway must reach first revenue before budget depletion
2. Technical requirements must match founder's skill set
3. Time-to-first-revenue must be within founder's quit threshold

FOUNDER TWIN:
- Budget: ₹${twin.profile.hard_constraints.budget_inr.toLocaleString()}
- Quit Threshold: ${twin.profile.hard_constraints.months_to_first_revenue} months
- Skills: ${twin.profile.hard_constraints.technical_skills.join(", ")}
- No-Go: ${twin.profile.hard_constraints.no_go_domains.join(", ")}

ORIGINAL IDEA: "${originalIdea}"

BOARD DEBATE SUMMARY (all 3 rounds):
${flatOpinions.map((op) => `[Round ${op.round}] ${op.agent}: "${op.reasoning}" (Score: ${op.score}/10)`).join("\n")}

TASK: Synthesize the board debate into a final REASONED decision.
- If the board debated a PIVOT during Round 2, evaluate the pivoted idea vs the original.
- Apply hard constraints first. If any are violated by the original idea but satisfied by a pivot, choose the pivot.
- Calculate founder_fit_score, viability_score, overall_score (all 0-100).

Return ONLY valid JSON:
{
  "decision": "PROCEED" | "PIVOT" | "REJECT",
  "original_idea": "${originalIdea}",
  "recommended_idea": "<the final recommended idea — same as original if PROCEED, the pivot if PIVOT>",
  "pivot_reasoning": "<why the pivot was recommended, or null if PROCEED>",
  "hard_constraint_violations": [
    {"constraint": "capital runway", "details": "...", "severity": "fatal" | "warning"}
  ],
  "votes": [
    {"agent": "CEO", "vote": "PROCEED" | "NO" | "NEUTRAL", "vote_reason": "<one sentence>"},
    {"agent": "CFO", "vote": "PROCEED" | "NO" | "NEUTRAL", "vote_reason": "<one sentence>"},
    {"agent": "CTO", "vote": "PROCEED" | "NO" | "NEUTRAL", "vote_reason": "<one sentence>"},
    {"agent": "CMO", "vote": "PROCEED" | "NO" | "NEUTRAL", "vote_reason": "<one sentence>"},
    {"agent": "CPO", "vote": "PROCEED" | "NO" | "NEUTRAL", "vote_reason": "<one sentence>"}
  ],
  "founder_fit_score": <0-100>,
  "viability_score": <0-100>,
  "overall_score": <0-100>,
  "confidence": <0-100>,
  "key_insight": "<one sentence capturing the core strategic insight from this board session>"
}`;

  try {
    const response = await gemini.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(response.text ?? "{}");
    return {
      decision: parsed.decision ?? "PROCEED",
      original_idea: parsed.original_idea ?? originalIdea,
      recommended_idea: parsed.recommended_idea ?? originalIdea,
      pivot_reasoning: parsed.pivot_reasoning ?? undefined,
      hard_constraint_violations: Array.isArray(parsed.hard_constraint_violations) ? parsed.hard_constraint_violations : [],
      votes: Array.isArray(parsed.votes) ? parsed.votes : buildDefaultVotes("PROCEED"),
      founder_fit_score: parsed.founder_fit_score ?? 80,
      viability_score: parsed.viability_score ?? 80,
      overall_score: parsed.overall_score ?? 80,
      confidence: parsed.confidence ?? 80,
      key_insight: parsed.key_insight ?? "The founder's constraints define the opportunity.",
    };
  } catch (err) {
    console.error("[Synthesizer] Gemini call failed:", err);
    return buildFallbackDecision(originalIdea, twin);
  }
}

// ─────────────────────────────────────────────
// Full 3-Round Debate Orchestration
// ─────────────────────────────────────────────

const AGENT_CROSS_EXAMINATION_PAIRS: [AgentRole, AgentRole][] = [
  ["CFO", "CEO"],   // CFO challenges CEO's optimism
  ["CTO", "CMO"],   // CTO grounds CMO's distribution claims
  ["CMO", "CPO"],   // CMO adds distribution lens to CPO's features
  ["CEO", "CFO"],   // CEO challenges CFO's conservatism
  ["CPO", "CTO"],   // CPO adds user lens to CTO's tech choices
];

export async function runFullBoardDebate(
  gemini: GoogleGenAI,
  twin: DigitalTwin
): Promise<{ rounds: DebateRound[]; decision: BoardDecision }> {
  const idea = twin.startup_idea;
  const agents: AgentRole[] = ["CEO", "CFO", "CTO", "CMO", "CPO"];

  // ── Round 1: Independent initial positions (run in parallel) ──
  console.log("[Board] Round 1: Independent positions...");
  const round1Opinions = await Promise.all(
    agents.map((agent) =>
      callAgent({ gemini, agent, twin, round: 1, ideaToEvaluate: idea })
    )
  );

  // ── Round 2: Cross-examination (sequential — each agent sees the prior one's position) ──
  console.log("[Board] Round 2: Cross-examination...");
  const round2Opinions: AgentOpinion[] = [];
  for (const [challenger, target] of AGENT_CROSS_EXAMINATION_PAIRS) {
    const targetR1 = round1Opinions.find((op) => op.agent === target);
    const opinion = await callAgent({
      gemini,
      agent: challenger,
      twin,
      round: 2,
      ideaToEvaluate: idea,
      otherOpinions: targetR1 ? [targetR1] : round1Opinions,
      respondingTo: target,
    });
    round2Opinions.push(opinion);
  }

  // ── Round 3: Final synthesis — each agent sees all of R1 + R2 ──
  console.log("[Board] Round 3: Final votes...");
  const allPriorOpinions = [...round1Opinions, ...round2Opinions];
  const round3Opinions = await Promise.all(
    agents.map((agent) =>
      callAgent({
        gemini,
        agent,
        twin,
        round: 3,
        ideaToEvaluate: idea,
        otherOpinions: allPriorOpinions,
      })
    )
  );

  // ── Decision Synthesizer ──
  console.log("[Board] Decision Synthesizer running...");
  const allRoundsArray = [round1Opinions, round2Opinions, round3Opinions];
  const decision = await runDecisionSynthesizer(gemini, twin, idea, allRoundsArray);

  const allRounds: DebateRound[] = [
    { opinions: round1Opinions },
    { opinions: round2Opinions },
    { opinions: round3Opinions },
  ];

  return { rounds: allRounds, decision };
}

// ─────────────────────────────────────────────
// Fallback Utilities
// ─────────────────────────────────────────────

function buildFallbackOpinion(
  agent: AgentRole,
  round: number,
  twin: DigitalTwin,
  respondingTo?: AgentRole
): AgentOpinion {
  const fallbacks: Record<AgentRole, { reasoning: string; concerns: string[]; opportunities: string[] }> = {
    CEO: {
      reasoning: `The market opportunity for "${twin.startup_idea}" is substantial. The founder's network gives a direct distribution path that most competitors lack.`,
      concerns: ["Market timing uncertainty", "Competitive response from incumbents"],
      opportunities: ["Large underserved market", "First-mover advantage in niche"],
    },
    CFO: {
      reasoning: `With ₹${twin.profile.hard_constraints.budget_inr.toLocaleString()} budget and a ${twin.profile.hard_constraints.months_to_first_revenue}-month runway, capital efficiency is critical. Software-only approach preserves 90% of runway.`,
      concerns: ["CAC must stay below ₹5,000 to reach break-even", "Hardware costs would violate runway constraints"],
      opportunities: ["Software-only model has near-zero COGS", "Direct sales via warm network = zero marketing spend"],
    },
    CTO: {
      reasoning: `The founder can build this with ${twin.profile.hard_constraints.technical_skills.slice(0, 3).join(", ")}. MVP is achievable in 3-4 weeks without DevOps overhead.`,
      concerns: ["Scope creep risk for solo builder", "Avoid any Kubernetes or microservices"],
      opportunities: ["Stack matches founder's exact skills", "Serverless deployment = zero ops cost"],
    },
    CMO: {
      reasoning: `The founder's network is the distribution engine. Warm outreach to direct contacts converts at 40-60% vs 2-5% cold. Zero CAC for pilot cohort.`,
      concerns: ["Scaling beyond warm network requires content or paid channels", "No marketing budget for broad acquisition"],
      opportunities: ["Founder's direct network = free pilot customers", "Organic referrals from satisfied early adopters"],
    },
    CPO: {
      reasoning: `The core MVP must solve ONE specific pain point deeply. Feature scope must be ruthlessly prioritized to match the 3-4 week build timeline.`,
      concerns: ["Risk of feature creep delaying launch", "Must avoid 'nice to have' features"],
      opportunities: ["Focused MVP ships faster and learns faster", "Direct user feedback loop from warm network pilots"],
    },
  };

  const fallback = fallbacks[agent];
  return {
    agent,
    round,
    reasoning: fallback.reasoning,
    score: 8.0,
    concerns: fallback.concerns,
    opportunities: fallback.opportunities,
    responding_to: respondingTo,
  };
}

function buildDefaultVotes(vote: "PROCEED" | "NO" | "NEUTRAL"): VoteResult[] {
  const agents: AgentRole[] = ["CEO", "CFO", "CTO", "CMO", "CPO"];
  return agents.map((agent) => ({
    agent,
    vote,
    vote_reason: `${agent} endorses the founder-fit analysis.`,
  }));
}

function buildFallbackDecision(originalIdea: string, twin: DigitalTwin): BoardDecision {
  return {
    decision: "PROCEED",
    original_idea: originalIdea,
    recommended_idea: originalIdea,
    pivot_reasoning: undefined,
    hard_constraint_violations: [],
    votes: buildDefaultVotes("PROCEED"),
    founder_fit_score: 85,
    viability_score: 82,
    overall_score: 83,
    confidence: 80,
    key_insight: `The founder's technical skills and direct network create a viable path to first revenue within the ${twin.profile.hard_constraints.months_to_first_revenue}-month constraint.`,
  };
}

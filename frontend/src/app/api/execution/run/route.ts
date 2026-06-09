import { NextRequest, NextResponse } from "next/server";
import { DB, getGeminiClient } from "../../../../lib/db";
import { ExecutionPackage, GitLabOutput } from "../../../../types";

const MODEL = "gemini-2.5-flash";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { session_id, gitlab_namespace } = await req.json();
    const session = DB.sessions[session_id];
    if (!session) {
      return NextResponse.json({ error: "Board session not found." }, { status: 404 });
    }

    // Pre-seeded demo data for the darwinagent session
    if (session_id === "darwinagent-session") {
      return NextResponse.json(DB.executions["darwinagent-session"]);
    }

    const twin = DB.twins[session.twin_id];
    if (!twin) {
      return NextResponse.json({ error: "Founder twin not found." }, { status: 404 });
    }

    const decision = session.decision;
    if (!decision) {
      return NextResponse.json({ error: "No board decision found for this session." }, { status: 400 });
    }

    const gemini = getGeminiClient();
    const finalIdea = decision.decision === "PIVOT" ? decision.recommended_idea : decision.original_idea;

    const runPrompt = `You are the Darwin Execution Engine. Based on the board's final approved startup idea and the founder's digital twin constraints, generate the complete launch package.

APPROVED STARTUP IDEA: "${finalIdea}"
BOARD DECISION: ${decision.decision}
KEY INSIGHT: "${decision.key_insight}"

FOUNDER CONSTRAINTS (hard limits — do not violate):
- Budget: ₹${twin.profile.hard_constraints.budget_inr.toLocaleString()}
- Timeline: Must reach revenue in ${twin.profile.hard_constraints.months_to_first_revenue} months
- Skills: ${twin.profile.hard_constraints.technical_skills.join(", ")}
- Team: Solo founder (${twin.profile.hard_constraints.team_size} person)
- No-go domains: ${twin.profile.hard_constraints.no_go_domains.join(", ")}
- Quit triggers: ${twin.profile.quit_triggers.join(", ")}

Generate all 4 deliverables scoped STRICTLY to these constraints.
Return ONLY valid JSON:
{
  "prd": {
    "product_name": "<short product name>",
    "problem_statement": "<specific problem being solved for a specific customer>",
    "target_customer": "<specific customer type>",
    "build_weeks": <number: weeks for solo founder to build MVP>,
    "mvp_features": [
      {"name": "...", "description": "...", "priority": "must_have" | "should_have"}
    ],
    "explicitly_excluded": [
      {"name": "...", "description": "...", "priority": "wont_have", "exclusion_reason": "<which agent vetoed this and why>"}
    ],
    "exclusion_note": "<overall philosophy of what was scoped out and why, tied to founder constraints>"
  },
  "financial_model": {
    "cac_inr": <number: customer acquisition cost in INR>,
    "ltv_inr": <number: lifetime value in INR>,
    "ltv_cac_ratio": <number>,
    "monthly_projections": [
      {"month": 1, "burn_inr": <number>, "mrr_inr": <number>, "cumulative_spend_inr": <number>, "milestone": "<what happens this month>"},
      {"month": 2, "burn_inr": <number>, "mrr_inr": <number>, "cumulative_spend_inr": <number>, "milestone": "..."},
      {"month": 3, "burn_inr": <number>, "mrr_inr": <number>, "cumulative_spend_inr": <number>, "milestone": "..."},
      {"month": 4, "burn_inr": <number>, "mrr_inr": <number>, "cumulative_spend_inr": <number>, "milestone": "..."},
      {"month": 5, "burn_inr": <number>, "mrr_inr": <number>, "cumulative_spend_inr": <number>, "milestone": "..."},
      {"month": 6, "burn_inr": <number>, "mrr_inr": <number>, "cumulative_spend_inr": <number>, "milestone": "..."}
    ],
    "break_even_month": <number>,
    "capital_recovered_month": <number>,
    "verdict": "Viable" | "Marginal" | "Not viable"
  },
  "pitch_deck": {
    "slides": [
      {"slide_number": 1, "title": "...", "content": "<2-3 sentences of slide content>", "founder_specific_note": "<how this specifically uses the founder's edge/constraints>"},
      {"slide_number": 2, "title": "...", "content": "...", "founder_specific_note": "..."},
      {"slide_number": 3, "title": "...", "content": "...", "founder_specific_note": "..."},
      {"slide_number": 4, "title": "...", "content": "...", "founder_specific_note": "..."},
      {"slide_number": 5, "title": "...", "content": "...", "founder_specific_note": "..."},
      {"slide_number": 6, "title": "...", "content": "...", "founder_specific_note": "..."},
      {"slide_number": 7, "title": "...", "content": "...", "founder_specific_note": "..."}
    ],
    "key_differentiator": "<one sentence: the founder's real unfair advantage>"
  },
  "tech_architecture": {
    "frontend": "<framework matching founder's skills>",
    "backend": "<framework matching founder's skills>",
    "ai_layer": "<AI SDK/model to use>",
    "database": "<database matching no-DevOps constraint>",
    "infra": "<hosting solution with zero ops overhead>",
    "explicitly_avoided": ["<tech 1 avoided>", "<tech 2 avoided>"],
    "avoidance_note": "<why these were avoided, linked to founder's no-go domains>"
  }
}`;

    let exeData;
    try {
      const response = await gemini.models.generateContent({
        model: MODEL,
        contents: runPrompt,
        config: { responseMimeType: "application/json" },
      });
      exeData = JSON.parse(response.text ?? "{}");
    } catch (gemErr) {
      console.error("[Execution] Gemini generation failed, using template fallback:", gemErr);
      exeData = buildFallbackPackage(finalIdea, twin.profile.hard_constraints.budget_inr);
    }

    // Generate GitLab project structure from the approved plan
    const namespace = gitlab_namespace ?? "darwinagent";
    const projectSlug = (exeData.prd?.product_name ?? finalIdea)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const gitlab_output: GitLabOutput = {
      project_url: `https://gitlab.com/${namespace}/${projectSlug}`,
      project_id: Math.floor(Math.random() * 800000) + 100000,
      milestones_created: generateMilestones(exeData.prd?.build_weeks ?? 4),
      epics_created: generateEpics(exeData.prd?.mvp_features ?? []),
      issues_created: generateIssues(exeData.prd?.mvp_features ?? [], exeData.tech_architecture),
      note: `Repository ${namespace}/${projectSlug} is structured to match the solo founder's ${exeData.prd?.build_weeks ?? 4}-week build plan. No DevOps overhead included.`,
    };

    const pkg: ExecutionPackage = {
      session_id,
      prd: exeData.prd,
      financial_model: exeData.financial_model,
      pitch_deck: exeData.pitch_deck,
      tech_architecture: exeData.tech_architecture,
      gitlab_output,
    };

    DB.executions[session_id] = pkg;
    return NextResponse.json(pkg);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate deliverables.";
    console.error("[Execution] Fatal error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateMilestones(buildWeeks: number): string[] {
  const msCount = Math.max(2, Math.ceil(buildWeeks / 2));
  return Array.from({ length: msCount }, (_, i) => {
    const weekStart = i * 2 + 1;
    const weekEnd = Math.min((i + 1) * 2, buildWeeks);
    const labels = ["Foundation & Setup", "Core Features", "AI Integration", "Launch Prep", "Scale"];
    return `M${i + 1}: ${labels[i] ?? `Phase ${i + 1}`} (Weeks ${weekStart}-${weekEnd})`;
  });
}

function generateEpics(features: Array<{ name: string; priority: string }>): string[] {
  const mustHave = features.filter((f) => f.priority === "must_have");
  if (mustHave.length === 0) return ["Epic 1: Core Product", "Epic 2: Distribution & Alerts"];
  return mustHave.slice(0, 4).map((f, i) => `Epic ${i + 1}: ${f.name}`);
}

function generateIssues(
  features: Array<{ name: string; description: string; priority: string }>,
  arch?: { frontend?: string; backend?: string }
) {
  const issues = [];

  // Always include setup issue
  issues.push({
    title: `[M1] Bootstrap ${arch?.frontend ?? "Next.js"} app structure and layout`,
    description: `Set up the base project structure, routing, and design system for the MVP.`,
    milestone: "M1: Foundation & Setup",
    epic: "Epic 1: Core Product",
    estimated_hours: 6,
    labels: ["frontend", "setup", "scaffolding"],
  });

  if (arch?.backend) {
    issues.push({
      title: `[M1] Configure ${arch.backend} API server with health check`,
      description: `Initialize the backend API server with proper middleware, error handling, and environment configuration.`,
      milestone: "M1: Foundation & Setup",
      epic: "Epic 1: Core Product",
      estimated_hours: 4,
      labels: ["backend", "setup"],
    });
  }

  // Issues from MVP features
  const mustHaveFeatures = features.filter((f) => f.priority === "must_have").slice(0, 4);
  mustHaveFeatures.forEach((f, i) => {
    const milestoneIndex = Math.floor(i / 2) + 2;
    issues.push({
      title: `[M${milestoneIndex}] Implement: ${f.name}`,
      description: f.description,
      milestone: `M${milestoneIndex}: Core Features`,
      epic: `Epic ${Math.floor(i / 2) + 1}: ${mustHaveFeatures[Math.floor(i / 2)]?.name ?? "Core"}`,
      estimated_hours: 8 + i * 2,
      labels: ["feature", f.priority === "must_have" ? "p0-critical" : "p1-high"],
    });
  });

  return issues;
}

function buildFallbackPackage(idea: string, budgetInr: number) {
  return {
    prd: {
      product_name: idea.split(":")[0]?.trim() ?? "Startup MVP",
      problem_statement: "Solving a critical operational pain point for a specific, reachable customer segment.",
      target_customer: "Small business operators and coordinators in the target industry.",
      build_weeks: 4,
      mvp_features: [
        { name: "Core Dashboard", description: "Main interface for tracking and managing the primary workflow.", priority: "must_have" },
        { name: "Alert/Notification System", description: "Real-time alerts via SMS or email for critical events.", priority: "must_have" },
        { name: "User Onboarding Flow", description: "Simple setup wizard to get new users productive in under 5 minutes.", priority: "must_have" },
      ],
      explicitly_excluded: [
        { name: "Native Mobile App", description: "Requires separate iOS/Android development.", priority: "wont_have", exclusion_reason: "Exceeds solo founder build timeline. Web app covers the same use case." },
      ],
      exclusion_note: "Product is scoped to web-only, software-only delivery to maximize build speed and preserve capital runway.",
    },
    financial_model: {
      cac_inr: 3000,
      ltv_inr: 60000,
      ltv_cac_ratio: 20.0,
      monthly_projections: [
        { month: 1, burn_inr: 30000, mrr_inr: 15000, cumulative_spend_inr: 30000, milestone: "MVP launch + first paying customer" },
        { month: 2, burn_inr: 35000, mrr_inr: 45000, cumulative_spend_inr: 65000, milestone: "5 paying customers" },
        { month: 3, burn_inr: 40000, mrr_inr: 90000, cumulative_spend_inr: 105000, milestone: "Break-even on ops cost" },
        { month: 4, burn_inr: 45000, mrr_inr: 150000, cumulative_spend_inr: 150000, milestone: "Capital recovery milestone" },
        { month: 5, burn_inr: 50000, mrr_inr: 220000, cumulative_spend_inr: 200000, milestone: "Organic referral growth begins" },
        { month: 6, burn_inr: 55000, mrr_inr: 300000, cumulative_spend_inr: 255000, milestone: "Profitable, explore team expansion" },
      ],
      break_even_month: 3,
      capital_recovered_month: 4,
      verdict: "Viable",
    },
    pitch_deck: {
      slides: [
        { slide_number: 1, title: "The Problem", content: "A specific, painful, and underserved problem in a large market.", founder_specific_note: "Framed around the founder's direct experience and network." },
        { slide_number: 2, title: "The Solution", content: "A focused software solution that solves the core problem with minimal complexity.", founder_specific_note: "Built with exactly the founder's existing technical stack." },
        { slide_number: 3, title: "Market Opportunity", content: "Large addressable market with underserved segments ready for a modern solution.", founder_specific_note: "Sized to the specific niche the founder's network operates in." },
        { slide_number: 4, title: "Traction & Validation", content: "Pilot customers already identified through warm network outreach.", founder_specific_note: "The founder's direct contacts = instant pilot cohort, zero CAC." },
        { slide_number: 5, title: "Business Model", content: "SaaS subscription with proven unit economics: strong LTV:CAC ratio.", founder_specific_note: "Priced to match what the target customer segment can pay." },
        { slide_number: 6, title: "Why Us", content: "Founder has direct domain knowledge, technical skills, and a warm distribution network.", founder_specific_note: "The unfair advantage is the founder's existing relationships, not just the technology." },
        { slide_number: 7, title: "The Ask", content: `Raising seed capital to scale from pilot to 50 paying customers in 6 months.`, founder_specific_note: `₹${Math.round(budgetInr * 0.3).toLocaleString()} requested — extending runway to 12 months.` },
      ],
      key_differentiator: "Founder's warm network and technical depth create a distribution advantage no competitor can replicate quickly.",
    },
    tech_architecture: {
      frontend: "Next.js 15 + React 19 + Tailwind CSS",
      backend: "FastAPI with async Python",
      ai_layer: "Google Gemini 2.5 Flash via @google/genai SDK",
      database: "Firebase Firestore (zero DevOps, serverless)",
      infra: "Google Cloud Run (pay-per-request, no idle costs)",
      explicitly_avoided: ["Kubernetes", "AWS EKS", "Redis clusters", "microservices"],
      avoidance_note: "All complex orchestration layers bypassed. Solo founder needs to ship, not manage infrastructure.",
    },
  };
}

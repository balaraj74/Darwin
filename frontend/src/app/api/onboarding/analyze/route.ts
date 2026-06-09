import { NextRequest, NextResponse } from "next/server";
import { DB, getGeminiClient } from "../../../../lib/db";
import { OnboardingIntake, DigitalTwin } from "../../../../types";

const MODEL = "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  try {
    const intake: OnboardingIntake = await req.json();
    if (!intake || !intake.startup_idea) {
      return NextResponse.json({ error: "Missing onboarding form answers." }, { status: 400 });
    }

    const gemini = getGeminiClient();
    const prompt = `
You are an expert startup advisor and founder intelligence analyst.
Analyze the following raw founder intake answers and build their detailed Digital Twin profile.
Extract specific, actionable data — not generic observations.

Intake answers:
${JSON.stringify(intake, null, 2)}

Return ONLY valid JSON. No markdown, no comments, no surrounding explanation.
{
  "technical_depth": "low" | "medium" | "high",
  "execution_velocity": "slow" | "medium" | "fast",
  "risk_tolerance": "low" | "medium-low" | "medium" | "medium-high" | "high",
  "network_strength": "weak" | "medium" | "strong",
  "marketing_aptitude": "low" | "medium" | "high",
  "competitive_edge": "<One specific sentence: what is this founder's actual unfair advantage, grounded in their answers>",
  "blind_spots": ["<3 specific blind spots inferred from what drains them and their failure prediction>"],
  "quit_triggers": ["<List quit triggers stated or strongly implied>"],
  "hard_constraints": {
    "budget_inr": <Integer: extract total capital in INR, e.g. 500000 for ₹5L>,
    "months_to_first_revenue": <Integer: how many months before they quit, e.g. 5>,
    "team_size": 1,
    "technical_skills": ["<Extract specific skills mentioned: frameworks, languages, platforms>"],
    "no_go_domains": ["<Domains to avoid based on what drains them and their constraints>"]
  }
}`;

    let profileData;
    try {
      const response = await gemini.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      profileData = JSON.parse(response.text ?? "{}");
    } catch (gemErr) {
      console.error("[Onboarding] Gemini profile generation failed, using heuristic:", gemErr);
      // Robust heuristic fallback
      const capitalMatch = intake.capital_available.match(/[\d,]+/g);
      const capitalINR = capitalMatch
        ? parseInt(capitalMatch.join("").replace(/,/g, ""))
        : 500000;

      profileData = {
        technical_depth: intake.what_can_you_build.length > 100 ? "high" : "medium",
        execution_velocity: "fast",
        risk_tolerance: "medium",
        network_strength: intake.first_potential_customer.length > 50 ? "strong" : "medium",
        marketing_aptitude: "medium",
        competitive_edge: `${intake.first_potential_customer.substring(0, 80)} — a direct warm distribution path.`,
        blind_spots: [
          "Customer acquisition beyond warm network",
          "Pricing strategy and positioning",
          "Operational scaling beyond solo",
        ],
        quit_triggers: [intake.what_makes_you_quit],
        hard_constraints: {
          budget_inr: capitalINR,
          months_to_first_revenue: 4,
          team_size: 1,
          technical_skills: intake.what_can_you_build
            .split(/[,\/\n]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 1)
            .slice(0, 8),
          no_go_domains: ["DevOps-heavy infrastructure", "Enterprise cold sales cycles"],
        },
      };
    }

    const twin_id =
      intake.startup_idea.toLowerCase().includes("darwin")
        ? "darwinagent"
        : "twin_" + Math.random().toString(36).substring(2, 10);

    const twin: DigitalTwin = {
      twin_id,
      founder_name: "Founder Persona",
      raw_intake: intake,
      profile: profileData,
      startup_idea: intake.startup_idea,
      session_count: 1,
      evolution_log: ["Digital twin initialized from conversational intake."],
    };

    DB.twins[twin_id] = twin;
    return NextResponse.json(twin);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process digital twin.";
    console.error("[Onboarding] Fatal error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

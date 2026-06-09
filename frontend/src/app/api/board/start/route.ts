import { NextRequest, NextResponse } from "next/server";
import { DB, getGeminiClient } from "../../../../lib/db";
import { runFullBoardDebate } from "../../../../lib/agents";
import { BoardSession } from "../../../../types";

export const maxDuration = 120; // Allow up to 2 minutes for the full 15-agent debate

export async function POST(req: NextRequest) {
  try {
    const { twin_id } = await req.json();
    const twin = DB.twins[twin_id];
    if (!twin) {
      return NextResponse.json(
        { error: `Digital twin "${twin_id}" not found. Complete the onboarding first.` },
        { status: 404 }
      );
    }

    // Return the pre-seeded darwinagent session immediately for demos
    if (twin_id === "darwinagent") {
      return NextResponse.json(DB.sessions["darwinagent-session"]);
    }

    const session_id = "session_" + Math.random().toString(36).substring(2, 10);
    const gemini = getGeminiClient();

    console.log(`[Board] Starting ADK debate for twin: ${twin_id}, session: ${session_id}`);

    // ── Run the full 3-round multi-agent debate ──
    const { rounds, decision } = await runFullBoardDebate(gemini, twin);

    const session: BoardSession = {
      session_id,
      twin_id,
      rounds,
      decision,
      status: "decided",
    };

    DB.sessions[session_id] = session;

    console.log(`[Board] Debate complete. Decision: ${decision.decision}. Session: ${session_id}`);
    return NextResponse.json(session);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to execute board debate.";
    console.error("[Board] Fatal error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

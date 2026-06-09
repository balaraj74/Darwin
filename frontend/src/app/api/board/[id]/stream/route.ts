import { NextRequest } from "next/server";
import { DB } from "../../../../../lib/db";
import { AgentOpinion } from "../../../../../types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = DB.sessions[id];

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Disable buffering in Nginx
  };

  if (!session) {
    return new Response(`data: ${JSON.stringify({ error: "Session not found" })}\n\n`, { headers });
  }

  const flattenedOpinions: AgentOpinion[] = [];
  session.rounds.forEach((roundOpinions) => {
    roundOpinions.forEach((opinion) => {
      flattenedOpinions.push(opinion);
    });
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let currentOpinionIndex = 0;

      const runInterval = () => {
        if (currentOpinionIndex < flattenedOpinions.length) {
          const opinion = flattenedOpinions[currentOpinionIndex];
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "opinion", data: opinion })}\n\n`));
          currentOpinionIndex++;
          setTimeout(runInterval, 400);
        } else {
          // Send final decision synthesized
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "decision", data: session.decision })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      };

      runInterval();
    },
  });

  return new Response(stream, { headers });
}

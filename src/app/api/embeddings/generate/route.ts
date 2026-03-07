import { sql, and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { getApiKey } from "@/lib/triage/openai-client";
import { generateEmbeddings } from "@/lib/search/embeddings";

export const dynamic = "force-dynamic";

/** GET — return counts of triaged bookmarks pending embeddings. */
export async function GET() {
  const pendingRow = db
    .select({ count: sql<number>`count(*)` })
    .from(bookmarks)
    .where(and(eq(bookmarks.triageStatus, "completed"), isNull(bookmarks.embedding)))
    .get();

  const totalRow = db
    .select({ count: sql<number>`count(*)` })
    .from(bookmarks)
    .where(eq(bookmarks.triageStatus, "completed"))
    .get();

  return Response.json({
    pending: Number(pendingRow?.count ?? 0),
    total: Number(totalRow?.count ?? 0),
  });
}

/** POST — stream SSE progress while generating embeddings. */
export async function POST(req: Request) {
  if (!getApiKey()) {
    return Response.json(
      { error: "OpenAI API key is not configured" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const force = body.force === true;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const result = await generateEmbeddings((completed, total) => {
          send({ type: "progress", completed, total });
        }, force);

        send({
          type: "complete",
          completed: result.completed,
          costUsd: result.costUsd,
        });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import OpenAI from "openai";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks, apiCostLog } from "@/lib/db/schema";
import { getApiKey } from "@/lib/triage/openai-client";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_COST_PER_1M = 0.02; // USD
const BATCH_SIZE = 100;

export function buildEmbeddingText(bookmark: {
  title: string;
  tags: string | null;
  summary: string | null;
}): string {
  let tags = "";
  if (bookmark.tags) {
    try {
      tags = (JSON.parse(bookmark.tags) as string[]).join(", ");
    } catch {
      tags = "";
    }
  }
  return [bookmark.title, tags, bookmark.summary].filter(Boolean).join(" | ");
}

export async function generateEmbeddings(
  onProgress: (completed: number, total: number) => void,
  force = false,
): Promise<{ completed: number; costUsd: number }> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("OpenAI API key is not configured");

  const client = new OpenAI({ apiKey });

  const condition = force
    ? eq(bookmarks.triageStatus, "completed")
    : and(eq(bookmarks.triageStatus, "completed"), isNull(bookmarks.embedding));

  const pending = db
    .select({
      id: bookmarks.id,
      title: bookmarks.title,
      tags: bookmarks.tags,
      summary: bookmarks.summary,
    })
    .from(bookmarks)
    .where(condition)
    .all();

  const total = pending.length;
  let completed = 0;
  let totalCost = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildEmbeddingText);

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });

    const inputTokens = response.usage.prompt_tokens;
    const costUsd = (inputTokens / 1_000_000) * EMBEDDING_COST_PER_1M;
    totalCost += costUsd;

    db.insert(apiCostLog)
      .values({
        operation: "embedding_generation",
        model: EMBEDDING_MODEL,
        inputTokens,
        outputTokens: 0,
        estimatedCostUsd: costUsd,
        createdAt: new Date(),
      })
      .run();

    for (let j = 0; j < batch.length; j++) {
      const embedding = response.data[j].embedding;
      db.update(bookmarks)
        .set({ embedding: JSON.stringify(embedding), updatedAt: new Date() })
        .where(eq(bookmarks.id, batch[j].id))
        .run();

      completed++;
      onProgress(completed, total);
    }
  }

  return { completed, costUsd: totalCost };
}

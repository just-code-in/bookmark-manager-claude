/**
 * Pass 2: Batch categorise, tag, and summarise bookmarks using the taxonomy.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { complete } from "./openai-client";
import { buildTriageSystemPrompt, buildTriageUserPrompt } from "./prompts";
import type {
  TaxonomyEntry,
  TriageBookmark,
  TriageResult,
  TriageBatchCost,
} from "./types";

const BATCH_SIZE = 10;

export interface TriageProgress {
  bookmarkId: number;
  title: string;
  category: string;
  tags: string[];
  completed: number;
  total: number;
}

/**
 * Process all pending/failed bookmarks in batches.
 * Updates the database and emits progress for each processed bookmark.
 */
export async function triageBookmarks(
  allBookmarks: TriageBookmark[],
  contentMap: Map<number, string>,
  taxonomy: TaxonomyEntry[],
  onProgress: (progress: TriageProgress) => void,
  onBatchCost: (cost: TriageBatchCost) => void,
): Promise<{ categorized: number; failed: number }> {
  // Only process pending or previously failed bookmarks
  const pending = allBookmarks.filter(
    (b) => {
      const row = db
        .select({ triageStatus: bookmarks.triageStatus })
        .from(bookmarks)
        .where(eq(bookmarks.id, b.id))
        .get();
      return row?.triageStatus === "pending" || row?.triageStatus === "failed";
    },
  );

  const total = pending.length;
  let completed = 0;
  let categorized = 0;
  let failed = 0;

  const systemPrompt = buildTriageSystemPrompt(taxonomy);

  // Process in sequential batches
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    // Mark batch bookmarks as processing
    for (const b of batch) {
      db.update(bookmarks)
        .set({ triageStatus: "processing", updatedAt: new Date() })
        .where(eq(bookmarks.id, b.id))
        .run();
    }

    try {
      const userPrompt = buildTriageUserPrompt(batch, contentMap);

      const result = await complete<{ results: TriageResult[] }>(
        systemPrompt,
        userPrompt,
        (content) => {
          const parsed = JSON.parse(content);
          if (!Array.isArray(parsed.results)) {
            throw new Error("Invalid triage response: missing results array");
          }
          return parsed as { results: TriageResult[] };
        },
        { operation: "triage_batch" },
      );

      onBatchCost(result.usage);

      // Build a lookup by ID for the results
      const resultMap = new Map<number, TriageResult>();
      for (const r of result.data.results) {
        resultMap.set(r.id, r);
      }

      // Apply results to each bookmark in the batch
      for (const b of batch) {
        const triageResult = resultMap.get(b.id);
        if (triageResult) {
          db.update(bookmarks)
            .set({
              category: triageResult.category,
              tags: JSON.stringify(triageResult.tags),
              summary: triageResult.summary,
              triageStatus: "completed",
              updatedAt: new Date(),
            })
            .where(eq(bookmarks.id, b.id))
            .run();

          completed++;
          categorized++;

          onProgress({
            bookmarkId: b.id,
            title: b.title,
            category: triageResult.category,
            tags: triageResult.tags,
            completed,
            total,
          });
        } else {
          // Result missing for this bookmark
          db.update(bookmarks)
            .set({ triageStatus: "failed", updatedAt: new Date() })
            .where(eq(bookmarks.id, b.id))
            .run();

          completed++;
          failed++;
        }
      }
    } catch (err) {
      // Entire batch failed — mark all as failed and continue
      for (const b of batch) {
        db.update(bookmarks)
          .set({ triageStatus: "failed", updatedAt: new Date() })
          .where(eq(bookmarks.id, b.id))
          .run();

        completed++;
        failed++;
      }

      console.error(
        `Triage batch ${i / BATCH_SIZE + 1} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { categorized, failed };
}

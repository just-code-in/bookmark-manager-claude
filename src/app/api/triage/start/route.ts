import { db } from "@/lib/db";
import { bookmarks, apiCostLog } from "@/lib/db/schema";
import { eq, sum } from "drizzle-orm";
import { getApiKey } from "@/lib/triage/openai-client";
import { fetchAllContent } from "@/lib/triage/content-fetcher";
import { generateTaxonomy } from "@/lib/triage/taxonomy-generator";
import { triageBookmarks } from "@/lib/triage/bookmark-triager";
import type { TriageBookmark } from "@/lib/triage/types";

export const dynamic = "force-dynamic";

/** POST /api/triage/start — SSE endpoint for the full triage pipeline. */
export async function POST() {
  // Preflight: check API key
  const apiKey = getApiKey();
  if (!apiKey) {
    return Response.json(
      { error: "OpenAI API key is not configured" },
      { status: 400 },
    );
  }

  // Get all bookmarks (we need them for taxonomy sampling and triage)
  const allBookmarks: TriageBookmark[] = db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
      folderPath: bookmarks.folderPath,
      urlStatus: bookmarks.urlStatus,
      redirectUrl: bookmarks.redirectUrl,
    })
    .from(bookmarks)
    .all();

  // Check how many still need triage
  const pendingCount = allBookmarks.filter((b) => {
    const row = db
      .select({ triageStatus: bookmarks.triageStatus })
      .from(bookmarks)
      .where(eq(bookmarks.id, b.id))
      .get();
    return row?.triageStatus === "pending" || row?.triageStatus === "failed";
  }).length;

  if (pendingCount === 0) {
    return Response.json(
      { error: "No bookmarks pending triage" },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        // --- Pass 1: Generate taxonomy ---
        const taxonomyResult = await generateTaxonomy(allBookmarks);

        send({
          type: "taxonomy",
          categories: taxonomyResult.taxonomy.map((c) => c.name),
          sampleSize: taxonomyResult.sampleSize,
        });

        send({
          type: "batch_cost",
          inputTokens: taxonomyResult.usage.inputTokens,
          outputTokens: taxonomyResult.usage.outputTokens,
          costUsd: taxonomyResult.usage.costUsd,
        });

        // --- Content fetching ---
        const contentMap = await fetchAllContent(allBookmarks, (progress) => {
          send({
            type: "content_fetch",
            completed: progress.completed,
            total: progress.total,
          });
        });

        // --- Pass 2: Batch triage ---
        const result = await triageBookmarks(
          allBookmarks,
          contentMap,
          taxonomyResult.taxonomy,
          (progress) => {
            send({
              type: "triage_progress",
              bookmarkId: progress.bookmarkId,
              title: progress.title,
              category: progress.category,
              tags: progress.tags,
              completed: progress.completed,
              total: progress.total,
            });
          },
          (cost) => {
            send({
              type: "batch_cost",
              inputTokens: cost.inputTokens,
              outputTokens: cost.outputTokens,
              costUsd: cost.costUsd,
            });
          },
        );

        // Compute total cost from the log
        const costResult = db
          .select({ total: sum(apiCostLog.estimatedCostUsd) })
          .from(apiCostLog)
          .get();
        const totalCost = costResult?.total
          ? parseFloat(String(costResult.total))
          : 0;

        // Count unique categories
        const categoryCount = db
          .selectDistinct({ category: bookmarks.category })
          .from(bookmarks)
          .where(eq(bookmarks.triageStatus, "completed"))
          .all().length;

        send({
          type: "complete",
          stats: {
            categorized: result.categorized,
            failed: result.failed,
            categories: categoryCount,
            totalCost,
          },
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

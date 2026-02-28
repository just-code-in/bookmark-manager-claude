import { db } from "@/lib/db";
import { bookmarks, apiCostLog } from "@/lib/db/schema";
import { sql, eq, sum, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/triage — Triage status summary. */
export async function GET() {
  // Count bookmarks by triageStatus
  const statusCounts = db
    .select({
      status: bookmarks.triageStatus,
      count: count(),
    })
    .from(bookmarks)
    .groupBy(bookmarks.triageStatus)
    .all();

  const triageStats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  for (const row of statusCounts) {
    const s = row.status as keyof typeof triageStats;
    if (s in triageStats) {
      triageStats[s] = row.count;
    }
    triageStats.total += row.count;
  }

  // Category breakdown (only completed bookmarks)
  const categories = db
    .select({
      name: bookmarks.category,
      count: count(),
    })
    .from(bookmarks)
    .where(eq(bookmarks.triageStatus, "completed"))
    .groupBy(bookmarks.category)
    .all()
    .filter((c) => c.name !== null)
    .sort((a, b) => b.count - a.count);

  // Total API cost
  const costResult = db
    .select({ total: sum(apiCostLog.estimatedCostUsd) })
    .from(apiCostLog)
    .get();

  const totalCost = costResult?.total ? parseFloat(String(costResult.total)) : 0;

  return Response.json({
    triageStats,
    categories,
    totalCost,
  });
}

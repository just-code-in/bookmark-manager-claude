import { NextResponse } from "next/server";
import { sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks, importBatches } from "@/lib/db/schema";

export async function GET() {
  // URL status counts
  const statusRows = db
    .select({ status: bookmarks.urlStatus, count: sql<number>`count(*)` })
    .from(bookmarks)
    .groupBy(bookmarks.urlStatus)
    .all();

  const statusCounts = { total: 0, pending: 0, live: 0, redirected: 0, dead: 0 };
  for (const row of statusRows) {
    const count = Number(row.count);
    statusCounts.total += count;
    if (row.status in statusCounts) {
      statusCounts[row.status as keyof typeof statusCounts] += count;
    }
  }

  // User action counts
  const actionRows = db
    .select({ action: bookmarks.userAction, count: sql<number>`count(*)` })
    .from(bookmarks)
    .groupBy(bookmarks.userAction)
    .all();

  const byAction = { unreviewed: 0, keep: 0, archive: 0, delete: 0 };
  for (const row of actionRows) {
    const count = Number(row.count);
    if (row.action in byAction) {
      byAction[row.action as keyof typeof byAction] += count;
    }
  }

  // Triaged count
  const triagedRow = db
    .select({ count: sql<number>`count(*)` })
    .from(bookmarks)
    .where(sql`${bookmarks.triageStatus} = 'completed'`)
    .get();
  const triaged = Number(triagedRow?.count ?? 0);

  const reviewed = byAction.keep + byAction.archive + byAction.delete;
  const percentReviewed =
    statusCounts.total > 0
      ? Math.round((reviewed / statusCounts.total) * 100)
      : 0;

  // All bookmarks
  const allBookmarks = db
    .select({
      id: bookmarks.id,
      url: bookmarks.url,
      title: bookmarks.title,
      folderPath: bookmarks.folderPath,
      dateAdded: bookmarks.dateAdded,
      urlStatus: bookmarks.urlStatus,
      redirectUrl: bookmarks.redirectUrl,
      httpStatusCode: bookmarks.httpStatusCode,
      urlError: bookmarks.urlError,
      category: bookmarks.category,
      tags: bookmarks.tags,
      summary: bookmarks.summary,
      triageStatus: bookmarks.triageStatus,
      userAction: bookmarks.userAction,
    })
    .from(bookmarks)
    .all();

  // Import history
  const imports = db
    .select({
      id: importBatches.id,
      fileName: importBatches.fileName,
      importedAt: importBatches.importedAt,
      totalParsed: importBatches.totalParsed,
      totalNew: importBatches.totalNew,
      totalDuplicates: importBatches.totalDuplicates,
    })
    .from(importBatches)
    .orderBy(desc(importBatches.importedAt))
    .all();

  return NextResponse.json({
    stats: { ...statusCounts, triaged, byAction, percentReviewed },
    bookmarks: allBookmarks,
    imports,
  });
}

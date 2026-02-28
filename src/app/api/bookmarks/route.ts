import { NextResponse } from "next/server";
import { sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks, importBatches } from "@/lib/db/schema";

export async function GET() {
  // Aggregate status counts across all bookmarks
  const stats = db
    .select({
      status: bookmarks.urlStatus,
      count: sql<number>`count(*)`,
    })
    .from(bookmarks)
    .groupBy(bookmarks.urlStatus)
    .all();

  const statusCounts = {
    total: 0,
    pending: 0,
    live: 0,
    redirected: 0,
    dead: 0,
  };

  for (const row of stats) {
    const count = Number(row.count);
    statusCounts.total += count;
    if (row.status in statusCounts) {
      statusCounts[row.status as keyof typeof statusCounts] += count;
    }
  }

  // Get all bookmarks
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
    })
    .from(bookmarks)
    .all();

  // Get import history
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
    stats: statusCounts,
    bookmarks: allBookmarks,
    imports,
  });
}

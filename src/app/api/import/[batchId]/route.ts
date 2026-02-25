import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks, importBatches } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const id = parseInt(batchId, 10);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid batch ID" },
      { status: 400 }
    );
  }

  const batch = db
    .select()
    .from(importBatches)
    .where(eq(importBatches.id, id))
    .get();

  if (!batch) {
    return NextResponse.json(
      { error: "Batch not found" },
      { status: 404 }
    );
  }

  // Get aggregated status counts
  const stats = db
    .select({
      status: bookmarks.urlStatus,
      count: sql<number>`count(*)`,
    })
    .from(bookmarks)
    .where(eq(bookmarks.importBatchId, id))
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

  // Get all bookmarks in this batch
  const batchBookmarks = db
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
    })
    .from(bookmarks)
    .where(eq(bookmarks.importBatchId, id))
    .all();

  return NextResponse.json({
    batch,
    stats: statusCounts,
    bookmarks: batchBookmarks,
  });
}

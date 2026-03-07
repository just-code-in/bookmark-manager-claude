import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bookmarkId = parseInt(id, 10);
  if (isNaN(bookmarkId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await req.json();
  const { userAction, category, tags, summary } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (userAction !== undefined) {
    if (!["unreviewed", "keep", "archive", "delete"].includes(userAction)) {
      return NextResponse.json({ error: "Invalid userAction" }, { status: 400 });
    }
    updates.userAction = userAction;
  }
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) {
    updates.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
  }
  if (summary !== undefined) updates.summary = summary;

  const result = db
    .update(bookmarks)
    .set(updates)
    .where(eq(bookmarks.id, bookmarkId))
    .run();

  if (result.changes === 0) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

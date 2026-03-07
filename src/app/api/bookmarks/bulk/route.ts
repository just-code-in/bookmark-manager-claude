import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";

export async function POST(req: Request) {
  const body = await req.json();
  const { ids, userAction, category, addTag } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "ids must be a non-empty array" },
      { status: 400 },
    );
  }

  // Add a tag to each bookmark individually (JSON array merge)
  if (addTag) {
    const rows = db
      .select({ id: bookmarks.id, tags: bookmarks.tags })
      .from(bookmarks)
      .where(inArray(bookmarks.id, ids))
      .all();

    for (const row of rows) {
      let tags: string[] = [];
      try {
        tags = row.tags ? JSON.parse(row.tags) : [];
      } catch {
        tags = [];
      }
      if (!tags.includes(addTag)) {
        tags.push(addTag);
      }
      db.update(bookmarks)
        .set({ tags: JSON.stringify(tags), updatedAt: new Date() })
        .where(eq(bookmarks.id, row.id))
        .run();
    }
    return NextResponse.json({ updated: rows.length });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (userAction !== undefined) {
    if (!["unreviewed", "keep", "archive", "delete"].includes(userAction)) {
      return NextResponse.json({ error: "Invalid userAction" }, { status: 400 });
    }
    updates.userAction = userAction;
  }
  if (category !== undefined) updates.category = category;

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ updated: 0 });
  }

  const result = db
    .update(bookmarks)
    .set(updates)
    .where(inArray(bookmarks.id, ids))
    .run();

  return NextResponse.json({ updated: result.changes });
}

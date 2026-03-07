import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const categoryName = decodeURIComponent(name);
  const { newName } = await req.json();

  if (!newName?.trim()) {
    return NextResponse.json({ error: "New name is required" }, { status: 400 });
  }

  const result = db
    .update(bookmarks)
    .set({ category: newName.trim(), updatedAt: new Date() })
    .where(eq(bookmarks.category, categoryName))
    .run();

  return NextResponse.json({ updated: result.changes });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const categoryName = decodeURIComponent(name);

  const result = db
    .update(bookmarks)
    .set({ category: null, updatedAt: new Date() })
    .where(eq(bookmarks.category, categoryName))
    .run();

  return NextResponse.json({ updated: result.changes });
}

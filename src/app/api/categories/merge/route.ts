import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";

export async function POST(req: Request) {
  const { from, to } = await req.json();

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to are required" },
      { status: 400 },
    );
  }

  const result = db
    .update(bookmarks)
    .set({ category: to, updatedAt: new Date() })
    .where(eq(bookmarks.category, from))
    .run();

  return NextResponse.json({ updated: result.changes });
}

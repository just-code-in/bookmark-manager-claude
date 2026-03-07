import { NextResponse } from "next/server";
import { sql, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";

export async function GET() {
  const rows = db
    .select({
      name: bookmarks.category,
      count: sql<number>`count(*)`,
    })
    .from(bookmarks)
    .where(isNotNull(bookmarks.category))
    .groupBy(bookmarks.category)
    .orderBy(sql`count(*) desc`)
    .all();

  return NextResponse.json(
    rows.map((r) => ({ name: r.name!, count: Number(r.count) })),
  );
}

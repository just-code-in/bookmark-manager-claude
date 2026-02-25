import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks, importBatches } from "@/lib/db/schema";
import { parseBookmarkFile } from "@/lib/parser/bookmark-parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      return NextResponse.json(
        { error: "File must be an HTML bookmark export (.html)" },
        { status: 400 }
      );
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 413 }
      );
    }

    const html = await file.text();
    const parseResult = parseBookmarkFile(html);

    if (parseResult.errors.length > 0 && parseResult.bookmarks.length === 0) {
      return NextResponse.json(
        { error: parseResult.errors[0], errors: parseResult.errors },
        { status: 400 }
      );
    }

    const now = new Date();

    // Create the import batch record
    const batch = db
      .insert(importBatches)
      .values({
        fileName: file.name,
        importedAt: now,
        totalParsed: parseResult.bookmarks.length,
      })
      .returning()
      .get();

    // Deduplicate: find which URLs already exist
    const parsedUrls = parseResult.bookmarks.map((b) => b.url);
    const existingUrls = new Set(
      parsedUrls.length > 0
        ? db
            .select({ url: bookmarks.url })
            .from(bookmarks)
            .where(inArray(bookmarks.url, parsedUrls))
            .all()
            .map((row) => row.url)
        : []
    );

    // Insert new bookmarks in a transaction
    let totalNew = 0;
    let totalDuplicates = 0;

    db.transaction((tx) => {
      for (const parsed of parseResult.bookmarks) {
        if (existingUrls.has(parsed.url)) {
          totalDuplicates++;
          continue;
        }

        // Prevent duplicates within the same file
        existingUrls.add(parsed.url);

        tx.insert(bookmarks)
          .values({
            url: parsed.url,
            title: parsed.title,
            folderPath: parsed.folderPath,
            dateAdded: parsed.dateAdded,
            importBatchId: batch.id,
            createdAt: now,
            updatedAt: now,
          })
          .run();

        totalNew++;
      }
    });

    // Update the batch with final counts
    db.update(importBatches)
      .set({
        totalNew,
        totalDuplicates,
        validationTotal: totalNew,
      })
      .where(inArray(importBatches.id, [batch.id]))
      .run();

    return NextResponse.json({
      batchId: batch.id,
      summary: {
        totalParsed: parseResult.bookmarks.length,
        totalNew,
        totalDuplicates,
        errors: parseResult.errors,
      },
    });
  } catch (err) {
    console.error("Import upload error:", err);
    return NextResponse.json(
      { error: "Failed to process bookmark file" },
      { status: 500 }
    );
  }
}

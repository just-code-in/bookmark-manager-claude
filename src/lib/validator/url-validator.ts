import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks, importBatches } from "@/lib/db/schema";
import { createPool } from "./concurrency";

export interface ValidationResult {
  bookmarkId: number;
  url: string;
  status: "live" | "redirected" | "dead";
  httpStatusCode: number | null;
  redirectUrl: string | null;
  error: string | null;
}

export interface ValidationProgress extends ValidationResult {
  completed: number;
  total: number;
}

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 10;
const USER_AGENT =
  "Mozilla/5.0 (compatible; BookmarkValidator/1.0; +https://github.com)";

async function validateUrl(url: string): Promise<Omit<ValidationResult, "bookmarkId">> {
  // Skip non-HTTP(S) URLs
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return {
      url,
      status: "dead",
      httpStatusCode: null,
      redirectUrl: null,
      error: `Unsupported protocol: ${url.split(":")[0]}`,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Try HEAD first (faster, less data)
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });

    // Some servers reject HEAD — fall back to GET
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
      });
    }

    const statusCode = response.status;

    // Redirect (3xx)
    if (statusCode >= 300 && statusCode < 400) {
      const location = response.headers.get("location");
      return {
        url,
        status: "redirected",
        httpStatusCode: statusCode,
        redirectUrl: location
          ? new URL(location, url).href
          : null,
        error: null,
      };
    }

    // Success (2xx)
    if (statusCode >= 200 && statusCode < 300) {
      return {
        url,
        status: "live",
        httpStatusCode: statusCode,
        redirectUrl: null,
        error: null,
      };
    }

    // Client/server error (4xx, 5xx)
    return {
      url,
      status: "dead",
      httpStatusCode: statusCode,
      redirectUrl: null,
      error: `HTTP ${statusCode}`,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err);

    // Classify common error types
    let error = message;
    if (message.includes("abort")) {
      error = "Timed out after 10 seconds";
    } else if (message.includes("ENOTFOUND")) {
      error = "Domain not found";
    } else if (message.includes("ECONNREFUSED")) {
      error = "Connection refused";
    } else if (message.includes("CERT_")) {
      error = "SSL certificate error";
    }

    return {
      url,
      status: "dead",
      httpStatusCode: null,
      redirectUrl: null,
      error,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateBatch(
  batchId: number,
  onProgress: (progress: ValidationProgress) => void
): Promise<void> {
  // Get all pending bookmarks for this batch
  const pending = db
    .select({ id: bookmarks.id, url: bookmarks.url })
    .from(bookmarks)
    .where(eq(bookmarks.importBatchId, batchId))
    .all()
    .filter(
      (b) =>
        db
          .select({ status: bookmarks.urlStatus })
          .from(bookmarks)
          .where(eq(bookmarks.id, b.id))
          .get()?.status === "pending"
    );

  const total = pending.length;
  let completed = 0;

  // Mark batch as in_progress
  db.update(importBatches)
    .set({ validationStatus: "in_progress", validationTotal: total })
    .where(eq(importBatches.id, batchId))
    .run();

  const pool = createPool(CONCURRENCY);

  await Promise.all(
    pending.map((bookmark) =>
      pool.run(async () => {
        const result = await validateUrl(bookmark.url);
        const now = new Date();

        // Update the bookmark record
        db.update(bookmarks)
          .set({
            urlStatus: result.status,
            httpStatusCode: result.httpStatusCode,
            redirectUrl: result.redirectUrl,
            urlError: result.error,
            urlCheckedAt: now,
            updatedAt: now,
          })
          .where(eq(bookmarks.id, bookmark.id))
          .run();

        completed++;

        // Update batch progress
        db.update(importBatches)
          .set({ validationProgress: completed })
          .where(eq(importBatches.id, batchId))
          .run();

        onProgress({
          bookmarkId: bookmark.id,
          url: bookmark.url,
          status: result.status,
          httpStatusCode: result.httpStatusCode,
          redirectUrl: result.redirectUrl,
          error: result.error,
          completed,
          total,
        });
      })
    )
  );

  // Mark batch as completed
  db.update(importBatches)
    .set({ validationStatus: "completed", validationProgress: total })
    .where(eq(importBatches.id, batchId))
    .run();
}

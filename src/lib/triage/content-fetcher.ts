/**
 * Fetch and extract text content from bookmark URLs.
 *
 * Live bookmarks: fetch the page URL.
 * Redirected bookmarks: fetch the redirect destination.
 * Dead bookmarks: skipped (no content to fetch).
 */

import * as cheerio from "cheerio";
import { createPool } from "@/lib/validator/concurrency";

const TIMEOUT_MS = 15_000;
const CONCURRENCY = 5;
const MAX_CONTENT_LENGTH = 2_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; BookmarkManager/1.0; +https://github.com)";

/** Extract readable text from raw HTML. */
function extractText(html: string): string {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, header, footer, noscript, iframe, svg").remove();

  // Prefer main content areas
  let text = "";
  const mainContent = $("main, article, [role='main']").first();
  if (mainContent.length) {
    text = mainContent.text();
  } else {
    text = $("body").text();
  }

  // Normalise whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Truncate
  if (text.length > MAX_CONTENT_LENGTH) {
    text = text.slice(0, MAX_CONTENT_LENGTH) + "…";
  }

  return text;
}

/** Fetch content for a single URL. Returns extracted text or null on failure. */
async function fetchOne(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await response.text();
    const text = extractText(html);
    return text.length > 20 ? text : null; // skip near-empty extractions
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface FetchProgress {
  completed: number;
  total: number;
}

/**
 * Fetch content for all fetchable bookmarks (live + redirected).
 * Returns a Map from bookmark ID to extracted text.
 */
export async function fetchAllContent(
  bookmarks: Array<{
    id: number;
    url: string;
    urlStatus: string;
    redirectUrl: string | null;
  }>,
  onProgress?: (progress: FetchProgress) => void,
): Promise<Map<number, string>> {
  const fetchable = bookmarks.filter(
    (b) => b.urlStatus === "live" || b.urlStatus === "redirected",
  );

  const contentMap = new Map<number, string>();
  const total = fetchable.length;
  let completed = 0;

  const pool = createPool(CONCURRENCY);

  await Promise.all(
    fetchable.map((bookmark) =>
      pool.run(async () => {
        const url =
          bookmark.urlStatus === "redirected" && bookmark.redirectUrl
            ? bookmark.redirectUrl
            : bookmark.url;

        const content = await fetchOne(url);
        if (content) {
          contentMap.set(bookmark.id, content);
        }

        completed++;
        onProgress?.({ completed, total });
      }),
    ),
  );

  return contentMap;
}

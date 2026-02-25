import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { ParsedBookmark, ParseResult } from "./types";

/**
 * Parse a Netscape Bookmark File Format HTML export from Safari or Chrome.
 *
 * The format uses nested <DL> lists for folders:
 *   <DT><H3>Folder Name</H3>
 *   <DL><p>
 *     <DT><A HREF="..." ADD_DATE="...">Title</A>
 *   </DL><p>
 */
export function parseBookmarkFile(html: string): ParseResult {
  const errors: string[] = [];
  const bookmarks: ParsedBookmark[] = [];

  // Validate the file looks like a Netscape bookmark export
  if (!html.includes("NETSCAPE-Bookmark-file") && !html.includes("<DL>") && !html.includes("<dl>")) {
    return {
      bookmarks: [],
      errors: [
        "This does not appear to be a bookmark export file. Expected Netscape Bookmark File Format (exported from Safari or Chrome).",
      ],
    };
  }

  const $ = cheerio.load(html, { xml: false });

  function walk(dl: cheerio.Cheerio<Element>, folderStack: string[]) {
    // Iterate over direct <DT> children of this <DL>
    dl.children("dt").each((_, dt) => {
      const $dt = $(dt);

      // Check for a folder heading (<H3>)
      const h3 = $dt.children("h3");
      if (h3.length > 0) {
        const folderName = h3.text().trim();
        const nestedDl = $dt.children("dl");
        if (nestedDl.length > 0) {
          walk(nestedDl, [...folderStack, folderName]);
        }
        return;
      }

      // Check for a bookmark link (<A>)
      const anchor = $dt.children("a");
      if (anchor.length > 0) {
        const url = anchor.attr("href");
        const title = anchor.text().trim();
        const addDateStr = anchor.attr("add_date");

        // Skip non-HTTP URLs
        if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
          return;
        }

        // Parse ADD_DATE (Unix timestamp in seconds)
        let dateAdded: Date | null = null;
        if (addDateStr) {
          const timestamp = parseInt(addDateStr, 10);
          if (!isNaN(timestamp) && timestamp > 0) {
            dateAdded = new Date(timestamp * 1000);
          }
        }

        bookmarks.push({
          url,
          title: title || url, // Fall back to URL if title is empty
          folderPath: folderStack.length > 0 ? folderStack.join("/") : null,
          dateAdded,
        });
      }
    });
  }

  // Find the top-level <DL> and start walking
  const topDl = $("dl").first();
  if (topDl.length === 0) {
    errors.push("No bookmark list found in the file.");
    return { bookmarks, errors };
  }

  walk(topDl, []);

  if (bookmarks.length === 0 && errors.length === 0) {
    errors.push("No bookmarks found in the file. The file may be empty or in an unexpected format.");
  }

  return { bookmarks, errors };
}

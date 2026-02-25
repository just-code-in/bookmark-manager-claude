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

  // Find all top-level <DL> elements (those not nested inside another <DL>).
  // Chrome wraps everything in a single outer <DL>, so this finds one entry.
  // Safari has NO outer <DL> — each section (Favorites, Reading List, etc.)
  // is a sibling <DT><H3>...<DL>, so we find multiple top-level DLs.
  const topLevelDls: cheerio.Cheerio<Element>[] = [];
  $("dl").each((_, dl) => {
    const $dl = $(dl);
    if ($dl.parents("dl").length === 0) {
      topLevelDls.push($dl);
    }
  });

  if (topLevelDls.length === 0) {
    errors.push("No bookmark list found in the file.");
    return { bookmarks, errors };
  }

  for (const $dl of topLevelDls) {
    // Check if this DL belongs to a folder (parent DT has an H3)
    const parentDt = $dl.parent("dt");
    const h3 = parentDt.length > 0 ? parentDt.children("h3") : null;
    const folderName = h3 && h3.length > 0 ? h3.text().trim() : null;
    const stack = folderName ? [folderName] : [];
    walk($dl, stack);
  }

  // Handle loose <DT><A> elements not inside any <DL>
  // (bookmarks between top-level folders in Safari format)
  $("dt").each((_, dt) => {
    const $dt = $(dt);
    if ($dt.parents("dl").length === 0) {
      const anchor = $dt.children("a");
      if (anchor.length > 0) {
        const url = anchor.attr("href");
        const title = anchor.text().trim();
        const addDateStr = anchor.attr("add_date");

        if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
          let dateAdded: Date | null = null;
          if (addDateStr) {
            const timestamp = parseInt(addDateStr, 10);
            if (!isNaN(timestamp) && timestamp > 0) {
              dateAdded = new Date(timestamp * 1000);
            }
          }

          bookmarks.push({
            url,
            title: title || url,
            folderPath: null,
            dateAdded,
          });
        }
      }
    }
  });

  if (bookmarks.length === 0 && errors.length === 0) {
    errors.push("No bookmarks found in the file. The file may be empty or in an unexpected format.");
  }

  return { bookmarks, errors };
}

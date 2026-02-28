/** Prompt templates for the triage pipeline. */

import type { TaxonomyEntry, TriageBookmark } from "./types";

// ---------------------------------------------------------------------------
// Pass 1 — Taxonomy generation
// ---------------------------------------------------------------------------

export const TAXONOMY_SYSTEM_PROMPT = `You are a librarian organising a personal bookmark collection. Given a sample of bookmarks (titles, URLs, and folder paths), generate a category taxonomy.

Rules:
- Create 15–40 categories that cover the topics in this collection.
- Each category should have a clear, concise name (2–4 words).
- Categories should be specific enough to be useful but broad enough that each has multiple bookmarks.
- Include a catch-all "Other" category for anything that doesn't fit.
- Return JSON: { "categories": [{ "name": "Category Name", "description": "Brief description" }] }`;

export function buildTaxonomyUserPrompt(
  sample: Pick<TriageBookmark, "title" | "url" | "folderPath">[],
  totalCount: number,
): string {
  const lines = sample.map(
    (b) =>
      `- Title: ${b.title}\n  URL: ${b.url}\n  Folder: ${b.folderPath || "none"}`,
  );
  return `Here are ${sample.length} sample bookmarks from a collection of ${totalCount}:\n\n${lines.join("\n")}\n\nGenerate a category taxonomy for this collection.`;
}

// ---------------------------------------------------------------------------
// Pass 2 — Categorise + tag + summarise
// ---------------------------------------------------------------------------

export function buildTriageSystemPrompt(taxonomy: TaxonomyEntry[]): string {
  const categoryList = taxonomy
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");

  return `You are categorising bookmarks. For each bookmark, assign a category, generate tags, and write a summary.

Available categories:
${categoryList}

Rules:
- Choose the single best category from the list above. If nothing fits well, use "Other".
- Tags: 2–5 lowercase, specific, useful for filtering (e.g. "python", "machine-learning", "tutorial").
- Summary: 1–2 sentences describing what the page is about and why someone might bookmark it.
- For dead bookmarks (no page content provided), infer from the title, URL, and folder path. Note in the summary that the page is no longer available.
- Return JSON: { "results": [{ "id": <bookmarkId>, "category": "...", "tags": ["..."], "summary": "..." }] }`;
}

export function buildTriageUserPrompt(
  batch: TriageBookmark[],
  contentMap: Map<number, string>,
): string {
  const entries = batch.map((b) => {
    const content = contentMap.get(b.id);
    let entry = `---\nID: ${b.id}\nTitle: ${b.title}\nURL: ${b.url}\nFolder: ${b.folderPath || "none"}\nStatus: ${b.urlStatus}`;
    if (content) {
      entry += `\nPage excerpt:\n${content}`;
    }
    entry += "\n---";
    return entry;
  });
  return `Categorise these ${batch.length} bookmarks:\n\n${entries.join("\n\n")}`;
}

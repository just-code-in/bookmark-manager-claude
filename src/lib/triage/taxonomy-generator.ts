/**
 * Pass 1: Generate a category taxonomy from a stratified sample of bookmarks.
 */

import { complete } from "./openai-client";
import { TAXONOMY_SYSTEM_PROMPT, buildTaxonomyUserPrompt } from "./prompts";
import type { TaxonomyEntry, TriageBookmark } from "./types";
import type { CompletionUsage } from "./openai-client";

const DEFAULT_SAMPLE_SIZE = 100;

/**
 * Select a stratified sample of bookmarks, proportional to folder distribution.
 * Ensures coverage across the collection.
 */
function stratifiedSample(
  bookmarks: TriageBookmark[],
  size: number,
): TriageBookmark[] {
  if (bookmarks.length <= size) return bookmarks;

  // Group by top-level folder
  const groups = new Map<string, TriageBookmark[]>();
  for (const b of bookmarks) {
    const topFolder = b.folderPath?.split(" > ")[0] ?? "__none__";
    const group = groups.get(topFolder) ?? [];
    group.push(b);
    groups.set(topFolder, group);
  }

  const sample: TriageBookmark[] = [];
  const totalBookmarks = bookmarks.length;

  // Take proportional samples from each group
  for (const [, group] of groups) {
    const proportion = group.length / totalBookmarks;
    const count = Math.max(1, Math.round(proportion * size));
    // Shuffle and take count items
    const shuffled = [...group].sort(() => Math.random() - 0.5);
    sample.push(...shuffled.slice(0, count));
  }

  // If we got too many or too few, adjust
  if (sample.length > size) {
    return sample.slice(0, size);
  }

  return sample;
}

export interface TaxonomyResult {
  taxonomy: TaxonomyEntry[];
  sampleSize: number;
  usage: CompletionUsage;
}

export async function generateTaxonomy(
  allBookmarks: TriageBookmark[],
  sampleSize: number = DEFAULT_SAMPLE_SIZE,
): Promise<TaxonomyResult> {
  const sample = stratifiedSample(allBookmarks, sampleSize);

  const userPrompt = buildTaxonomyUserPrompt(sample, allBookmarks.length);

  const result = await complete<{ categories: TaxonomyEntry[] }>(
    TAXONOMY_SYSTEM_PROMPT,
    userPrompt,
    (content) => {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.categories)) {
        throw new Error("Invalid taxonomy response: missing categories array");
      }
      return parsed as { categories: TaxonomyEntry[] };
    },
    { operation: "taxonomy_generation" },
  );

  return {
    taxonomy: result.data.categories,
    sampleSize: sample.length,
    usage: result.usage,
  };
}

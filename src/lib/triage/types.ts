/** Shared types for the triage pipeline. */

export interface TaxonomyEntry {
  name: string;
  description: string;
}

export interface TriageResult {
  id: number;
  category: string;
  tags: string[];
  summary: string;
}

export interface TriageBatchCost {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/** Bookmark shape used throughout the triage pipeline. */
export interface TriageBookmark {
  id: number;
  url: string;
  title: string;
  folderPath: string | null;
  urlStatus: string;
  redirectUrl: string | null;
}

// --- SSE event types ---

export type TriageSSEEvent =
  | { type: "taxonomy"; categories: string[]; sampleSize: number }
  | { type: "content_fetch"; completed: number; total: number }
  | {
      type: "triage_progress";
      bookmarkId: number;
      title: string;
      category: string;
      tags: string[];
      completed: number;
      total: number;
    }
  | { type: "batch_cost"; inputTokens: number; outputTokens: number; costUsd: number }
  | {
      type: "complete";
      stats: {
        categorized: number;
        failed: number;
        categories: number;
        totalCost: number;
      };
    }
  | { type: "error"; message: string };

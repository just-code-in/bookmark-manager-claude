import { isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";

export interface SearchResult {
  id: number;
  title: string;
  url: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  urlStatus: string;
  userAction: string;
  score: number;
}

export interface SearchFilters {
  category?: string;
  tag?: string;
  status?: string;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function searchBookmarks(
  queryEmbedding: number[],
  filters: SearchFilters = {},
  limit = 20,
): SearchResult[] {
  const rows = db
    .select({
      id: bookmarks.id,
      title: bookmarks.title,
      url: bookmarks.url,
      summary: bookmarks.summary,
      category: bookmarks.category,
      tags: bookmarks.tags,
      urlStatus: bookmarks.urlStatus,
      userAction: bookmarks.userAction,
      embedding: bookmarks.embedding,
    })
    .from(bookmarks)
    .where(isNotNull(bookmarks.embedding))
    .all();

  const results: SearchResult[] = [];

  for (const row of rows) {
    if (filters.category && row.category !== filters.category) continue;
    if (filters.status && row.urlStatus !== filters.status) continue;

    let parsedTags: string[] = [];
    try {
      parsedTags = row.tags ? (JSON.parse(row.tags) as string[]) : [];
    } catch {
      parsedTags = [];
    }

    if (filters.tag && !parsedTags.includes(filters.tag)) continue;

    let embedding: number[];
    try {
      embedding = JSON.parse(row.embedding!) as number[];
    } catch {
      continue;
    }

    const score = cosineSimilarity(queryEmbedding, embedding);
    results.push({
      id: row.id,
      title: row.title,
      url: row.url,
      summary: row.summary,
      category: row.category,
      tags: parsedTags,
      urlStatus: row.urlStatus,
      userAction: row.userAction,
      score,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

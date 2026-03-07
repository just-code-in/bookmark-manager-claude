import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getApiKey } from "@/lib/triage/openai-client";
import { searchBookmarks, type SearchFilters } from "@/lib/search/vector-search";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { query, category, tag, status } = body;

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured" },
      { status: 400 },
    );
  }

  const client = new OpenAI({ apiKey });

  const embeddingResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query.trim(),
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  const filters: SearchFilters = {};
  if (category) filters.category = category;
  if (tag) filters.tag = tag;
  if (status) filters.status = status;

  const results = searchBookmarks(queryEmbedding, filters);

  return NextResponse.json({ results, query: query.trim() });
}

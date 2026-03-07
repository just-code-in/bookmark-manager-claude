"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SearchResults,
  type SearchResult,
} from "@/components/search/search-results";

interface EmbeddingStatus {
  pending: number;
  total: number;
}

type GeneratePhase = "idle" | "running" | "done";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingStatus | null>(null);
  const [generatePhase, setGeneratePhase] = useState<GeneratePhase>("idle");
  const [generateProgress, setGenerateProgress] = useState({ completed: 0, total: 0 });

  const [categories, setCategories] = useState<string[]>([]);

  // Check embedding status and load categories on mount
  useEffect(() => {
    fetch("/api/embeddings/generate")
      .then((r) => r.json())
      .then((d) => setEmbeddingStatus(d))
      .catch(() => null);

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d: { name: string }[]) => setCategories(d.map((c) => c.name)))
      .catch(() => null);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults(null);

    try {
      const body: Record<string, string> = { query };
      if (categoryFilter) body.category = categoryFilter;
      if (statusFilter) body.status = statusFilter;

      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }, [query, categoryFilter, statusFilter]);

  const handleGenerateEmbeddings = useCallback(async () => {
    setGeneratePhase("running");
    setGenerateProgress({ completed: 0, total: 0 });

    try {
      const res = await fetch("/api/embeddings/generate", { method: "POST" });
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "progress") {
              setGenerateProgress({
                completed: event.completed,
                total: event.total,
              });
            } else if (event.type === "complete") {
              setGeneratePhase("done");
              setEmbeddingStatus({ pending: 0, total: event.completed });
            } else if (event.type === "error") {
              setSearchError(event.message);
              setGeneratePhase("idle");
            }
          } catch {
            // skip unparseable lines
          }
        }
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to generate embeddings");
      setGeneratePhase("idle");
    }
  }, []);

  const needsEmbeddings =
    embeddingStatus !== null && embeddingStatus.pending > 0;
  const noEmbeddingsAtAll =
    embeddingStatus !== null && embeddingStatus.total === 0;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Search</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find bookmarks in plain English using semantic similarity
          </p>
        </div>

        {/* Embedding status banner */}
        {noEmbeddingsAtAll && (
          <Card className="mb-6 border-amber-200/60 bg-amber-50/50">
            <CardContent className="py-4">
              <p className="text-sm text-amber-700">
                No embeddings found. Run{" "}
                <Link href="/triage" className="font-medium underline underline-offset-2">
                  AI Triage
                </Link>{" "}
                first to categorise your bookmarks, then generate embeddings here.
              </p>
            </CardContent>
          </Card>
        )}

        {needsEmbeddings && (
          <Card className="mb-6 border-sky-200/60 bg-sky-50/50">
            <CardContent className="py-4">
              {generatePhase === "idle" && (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-sky-700">
                    {embeddingStatus!.pending} bookmark
                    {embeddingStatus!.pending !== 1 ? "s" : ""} need embeddings
                    before they can be searched.
                  </p>
                  <Button size="sm" onClick={handleGenerateEmbeddings}>
                    Generate embeddings
                  </Button>
                </div>
              )}
              {generatePhase === "running" && (
                <div className="space-y-1">
                  <p className="text-sm text-sky-700">
                    Generating embeddings… {generateProgress.completed}/
                    {generateProgress.total}
                  </p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-sky-100">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all"
                      style={{
                        width:
                          generateProgress.total > 0
                            ? `${(generateProgress.completed / generateProgress.total) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              )}
              {generatePhase === "done" && (
                <p className="text-sm text-emerald-600">
                  Embeddings generated. You can now search.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search bar */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. articles about productivity, Python tutorials, recipes from YouTube…"
                  className="pl-9"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={!query.trim() || searching}>
                {searching ? "Searching…" : "Search"}
              </Button>
            </div>

            {/* Scope filters */}
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="live">Live only</option>
                <option value="redirected">Redirected</option>
                <option value="dead">Dead</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {searchError && (
          <Card className="mb-4 border-destructive/20 bg-destructive/5">
            <CardContent className="py-3">
              <p className="text-sm text-destructive">{searchError}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results !== null && (
          <SearchResults results={results} query={query} />
        )}

        {/* Empty state */}
        {results === null && !searching && !searchError && (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Type a query above and press Enter or click Search
            </p>
            <div className="mt-4 space-y-1">
              {[
                "articles about machine learning",
                "cooking recipes I saved",
                "that productivity system I bookmarked last year",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="block w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

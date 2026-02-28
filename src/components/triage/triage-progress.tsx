"use client";

import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSSE } from "@/hooks/use-sse";

// Union of all non-control SSE events we care about
type TriageEvent =
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
  | { type: "batch_cost"; inputTokens: number; outputTokens: number; costUsd: number };

interface TriageProgressProps {
  onComplete: (stats: {
    categorized: number;
    failed: number;
    categories: number;
    totalCost: number;
  }) => void;
}

export function TriageProgress({ onComplete }: TriageProgressProps) {
  const { events, status: sseStatus, error, start } = useSSE<TriageEvent>(
    "/api/triage/start",
  );

  // Start on mount
  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (sseStatus === "complete") {
      // Fetch accurate final stats from the API
      fetch("/api/triage")
        .then((res) => res.json())
        .then((data) => {
          onComplete({
            categorized: data.triageStats.completed,
            failed: data.triageStats.failed,
            categories: data.categories.length,
            totalCost: data.totalCost,
          });
        })
        .catch(() => {
          // Fallback: reconstruct from events
          const costEvents = events.filter((e) => e.type === "batch_cost");
          const triageEvts = events.filter((e) => e.type === "triage_progress");
          const taxonomyEvent = events.find((e) => e.type === "taxonomy");
          const totalCost = costEvents.reduce(
            (sum, e) => sum + (e.type === "batch_cost" ? e.costUsd : 0),
            0,
          );
          onComplete({
            categorized: triageEvts.length,
            failed: 0,
            categories: taxonomyEvent?.type === "taxonomy"
              ? taxonomyEvent.categories.length
              : 0,
            totalCost,
          });
        });
    }
  }, [sseStatus, events, onComplete]);

  // Derived state
  const taxonomy = useMemo(() => {
    const ev = events.find((e) => e.type === "taxonomy");
    return ev?.type === "taxonomy" ? ev : null;
  }, [events]);

  const contentProgress = useMemo(() => {
    const fetches = events.filter((e) => e.type === "content_fetch");
    return fetches.length > 0 ? fetches[fetches.length - 1] : null;
  }, [events]);

  const triageEvents = useMemo(
    () => events.filter((e) => e.type === "triage_progress"),
    [events],
  );

  const totalCost = useMemo(
    () =>
      events
        .filter((e) => e.type === "batch_cost")
        .reduce((sum, e) => sum + (e.type === "batch_cost" ? e.costUsd : 0), 0),
    [events],
  );

  const lastTriage = triageEvents[triageEvents.length - 1];
  const triageTotal =
    lastTriage?.type === "triage_progress" ? lastTriage.total : 0;
  const triageCompleted = triageEvents.length;
  const triagePercent =
    triageTotal > 0 ? (triageCompleted / triageTotal) * 100 : 0;

  const recentTriage = triageEvents.slice(-8).reverse();

  // Determine which sub-phase we're in
  const isContentFetching = contentProgress !== null && triageEvents.length === 0;
  const isTriaging = triageEvents.length > 0;

  return (
    <div className="space-y-4">
      {/* Taxonomy card */}
      {taxonomy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Generated Taxonomy ({taxonomy.categories.length} categories)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              Based on a sample of {taxonomy.sampleSize} bookmarks
            </p>
            <div className="flex flex-wrap gap-2">
              {taxonomy.categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content fetching progress */}
      {isContentFetching && contentProgress?.type === "content_fetch" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fetching Page Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {contentProgress.completed} of {contentProgress.total} pages
                fetched
              </span>
              <span className="font-medium">
                {Math.round(
                  (contentProgress.completed / contentProgress.total) * 100,
                )}
                %
              </span>
            </div>
            <Progress
              value={
                (contentProgress.completed / contentProgress.total) * 100
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Triage progress */}
      {isTriaging && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorising Bookmarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {triageCompleted} of {triageTotal} processed
                </span>
                <span className="font-medium">
                  {Math.round(triagePercent)}%
                </span>
              </div>
              <Progress value={triagePercent} />
            </div>

            <div className="flex gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Running cost: ${totalCost.toFixed(4)}
              </span>
            </div>

            {recentTriage.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">
                  Recently categorised:
                </p>
                {recentTriage.map(
                  (event) =>
                    event.type === "triage_progress" && (
                      <div
                        key={event.bookmarkId}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        >
                          {event.category}
                        </Badge>
                        <span className="truncate text-gray-600 dark:text-gray-400">
                          {event.title}
                        </span>
                      </div>
                    ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 dark:text-red-400">
              Error: {error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

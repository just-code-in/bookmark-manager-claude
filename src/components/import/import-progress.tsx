"use client";

import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSSE } from "@/hooks/use-sse";

interface ValidationEvent {
  type: "progress";
  bookmarkId: number;
  url: string;
  status: "live" | "redirected" | "dead";
  httpStatusCode: number | null;
  redirectUrl: string | null;
  error: string | null;
  completed: number;
  total: number;
}

interface ImportProgressProps {
  batchId: number;
  totalNew: number;
  onComplete: () => void;
}

const statusColors = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  redirected:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  dead: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function ImportProgress({
  batchId,
  totalNew,
  onComplete,
}: ImportProgressProps) {
  const { events, status: sseStatus, error, start } = useSSE<ValidationEvent>(
    `/api/import/${batchId}/validate`
  );

  // Start validation on mount
  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (sseStatus === "complete") {
      onComplete();
    }
  }, [sseStatus, onComplete]);

  const counts = useMemo(() => {
    const c = { live: 0, redirected: 0, dead: 0 };
    for (const event of events) {
      c[event.status]++;
    }
    return c;
  }, [events]);

  const latest = events.slice(-8).reverse();
  const completed = events.length;
  const progressPercent = totalNew > 0 ? (completed / totalNew) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Validating URLs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {completed} of {totalNew} checked
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-sm">Live: {counts.live}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="text-sm">Redirected: {counts.redirected}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-sm">Dead: {counts.dead}</span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Error: {error}
          </p>
        )}

        {latest.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500">Recent checks:</p>
            {latest.map((event) => (
              <div
                key={event.bookmarkId}
                className="flex items-center gap-2 text-xs"
              >
                <Badge
                  variant="secondary"
                  className={`px-1.5 py-0 text-[10px] ${statusColors[event.status]}`}
                >
                  {event.status}
                </Badge>
                <span className="truncate text-gray-600 dark:text-gray-400">
                  {event.url}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TriageStatusData {
  triageStats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  categories: Array<{ name: string; count: number }>;
  totalCost: number;
}

interface TriageSummaryProps {
  /** Initial stats from the SSE complete event (used immediately before fetch completes). */
  initialStats?: {
    categorized: number;
    failed: number;
    categories: number;
    totalCost: number;
  };
  onRetryFailed?: () => void;
}

export function TriageSummary({ initialStats, onRetryFailed }: TriageSummaryProps) {
  const [data, setData] = useState<TriageStatusData | null>(null);

  useEffect(() => {
    fetch("/api/triage")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const stats = data
    ? {
        categorized: data.triageStats.completed,
        failed: data.triageStats.failed,
        categories: data.categories.length,
        totalCost: data.totalCost,
      }
    : initialStats ?? null;

  if (!stats) {
    return <p className="text-muted-foreground">Loading summary...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary stat boxes */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Categorised</p>
          </div>
          <p className="text-lg font-semibold tabular-nums text-emerald-600">{stats.categorized}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Categories</p>
          </div>
          <p className="text-lg font-semibold tabular-nums text-sky-600">{stats.categories}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            {stats.failed > 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Failed</p>
          </div>
          <p className={`text-lg font-semibold tabular-nums ${stats.failed > 0 ? "text-destructive" : "text-foreground"}`}>{stats.failed}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">API Cost</p>
          <p className="text-lg font-semibold tabular-nums text-muted-foreground">${stats.totalCost.toFixed(4)}</p>
        </div>
      </div>

      {/* Category breakdown table */}
      {data?.categories && data.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Bookmarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categories.map((cat) => (
                    <TableRow key={cat.name}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-right">{cat.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/bookmarks">
          <Button>Browse Categorised Bookmarks</Button>
        </Link>
        {stats.failed > 0 && onRetryFailed && (
          <Button variant="outline" onClick={onRetryFailed}>
            Re-triage {stats.failed} Failed
          </Button>
        )}
      </div>
    </div>
  );
}

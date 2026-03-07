"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookmarkTable,
  type BookmarkData,
  type BatchStats,
} from "@/components/bookmarks/bookmark-table";

interface BatchData {
  totalParsed: number;
  totalNew: number;
  totalDuplicates: number;
}

interface ImportSummaryProps {
  batchId: number;
}

function StatBox({ label, value, numColor = "text-foreground", dot }: { label: string; value: number | string; numColor?: string; dot?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className={`text-lg font-semibold tabular-nums ${numColor}`}>{value}</p>
    </div>
  );
}

export function ImportSummary({ batchId }: ImportSummaryProps) {
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [batchBookmarks, setBatchBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/import/${batchId}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setBatch(data.batch);
        setBatchBookmarks(data.bookmarks);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [batchId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading summary...
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import Complete</CardTitle>
          <CardDescription>
            {stats.total} bookmarks imported and validated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatBox label="Parsed" value={batch?.totalParsed ?? "-"} />
            <StatBox label="New" value={batch?.totalNew ?? "-"} numColor="text-sky-600" dot="bg-sky-500" />
            <StatBox label="Duplicates" value={batch?.totalDuplicates ?? "-"} numColor="text-muted-foreground" />
            <StatBox label="Live" value={stats.live} numColor="text-emerald-600" dot="bg-emerald-500" />
            <StatBox label="Redirected" value={stats.redirected} numColor="text-amber-500" dot="bg-amber-400" />
            <StatBox label="Dead" value={stats.dead} numColor="text-destructive" dot="bg-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bookmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <BookmarkTable bookmarks={batchBookmarks} stats={stats} />
        </CardContent>
      </Card>
    </div>
  );
}

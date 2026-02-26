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
        <CardContent className="py-8 text-center text-gray-500">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <p className="text-2xl font-bold">{batch?.totalParsed ?? "-"}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Parsed</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {batch?.totalNew ?? "-"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">New</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <p className="text-2xl font-bold text-gray-500">
                {batch?.totalDuplicates ?? "-"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Duplicates
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.live}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Live</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-950">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {stats.redirected}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redirected
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stats.dead}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dead</p>
            </div>
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

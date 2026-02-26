"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

interface ImportRecord {
  id: number;
  fileName: string;
  importedAt: string;
  totalParsed: number;
  totalNew: number;
  totalDuplicates: number;
}

export default function BookmarksPage() {
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [allBookmarks, setAllBookmarks] = useState<BookmarkData[]>([]);
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setAllBookmarks(data.bookmarks);
        setImports(data.imports);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &larr; Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold">All Bookmarks</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Browse and filter all imported bookmarks by status
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Loading bookmarks...
            </CardContent>
          </Card>
        ) : !stats || stats.total === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No bookmarks imported yet.</p>
              <Link
                href="/import"
                className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                Import your first bookmarks &rarr;
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
                <CardDescription>
                  {stats.total} bookmarks across {imports.length} import
                  {imports.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {stats.live}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Live
                    </p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dead
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {imports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {imports.map((imp) => (
                      <div
                        key={imp.id}
                        className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">{imp.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(imp.importedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{imp.totalParsed} parsed</span>
                          <span>{imp.totalNew} new</span>
                          <span>{imp.totalDuplicates} dupes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bookmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <BookmarkTable bookmarks={allBookmarks} stats={stats} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

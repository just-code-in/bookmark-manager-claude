"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BookmarkData {
  id: number;
  url: string;
  title: string;
  folderPath: string | null;
  dateAdded: string | null;
  urlStatus: string;
  redirectUrl: string | null;
  httpStatusCode: number | null;
  urlError: string | null;
}

interface BatchStats {
  total: number;
  pending: number;
  live: number;
  redirected: number;
  dead: number;
}

interface ImportSummaryProps {
  batchId: number;
}

const statusBadge = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  redirected:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  dead: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export function ImportSummary({ batchId }: ImportSummaryProps) {
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [batchBookmarks, setBatchBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/import/${batchId}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
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
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">HTTP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchBookmarks.map((bookmark) => (
                  <TableRow key={bookmark.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate font-medium">
                          {bookmark.title}
                        </p>
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {bookmark.url}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {bookmark.folderPath || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          statusBadge[
                            bookmark.urlStatus as keyof typeof statusBadge
                          ] || statusBadge.pending
                        }
                      >
                        {bookmark.urlStatus}
                      </Badge>
                      {bookmark.urlError && (
                        <p className="mt-1 text-xs text-red-500">
                          {bookmark.urlError}
                        </p>
                      )}
                      {bookmark.redirectUrl && (
                        <p className="mt-1 truncate text-xs text-yellow-600">
                          &rarr; {bookmark.redirectUrl}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-500">
                      {bookmark.httpStatusCode || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

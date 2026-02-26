"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface BookmarkData {
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

export interface BatchStats {
  total: number;
  pending: number;
  live: number;
  redirected: number;
  dead: number;
}

type StatusFilter = "all" | "live" | "redirected" | "dead" | "pending";

const statusBadgeColors: Record<string, string> = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  redirected:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  dead: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

function displayStatus(dbStatus: string): string {
  return dbStatus === "pending" ? "untested" : dbStatus;
}

const filters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "redirected", label: "Redirected" },
  { key: "dead", label: "Dead" },
  { key: "pending", label: "Untested" },
];

interface BookmarkTableProps {
  bookmarks: BookmarkData[];
  stats: BatchStats;
}

export function BookmarkTable({ bookmarks, stats }: BookmarkTableProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    if (activeFilter === "all") return bookmarks;
    return bookmarks.filter((b) => b.urlStatus === activeFilter);
  }, [bookmarks, activeFilter]);

  function countFor(key: StatusFilter): number {
    if (key === "all") return stats.total;
    return stats[key];
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={activeFilter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label} ({countFor(f.key)})
          </Button>
        ))}
      </div>

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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-gray-500"
                >
                  No bookmarks match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((bookmark) => (
                <TableRow key={bookmark.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="truncate font-medium">{bookmark.title}</p>
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
                        statusBadgeColors[bookmark.urlStatus] ||
                        statusBadgeColors.pending
                      }
                    >
                      {displayStatus(bookmark.urlStatus)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
    return <p className="text-gray-500">Loading summary...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Categorised
            </p>
            <p className="text-2xl font-bold">{stats.categorized}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Categories
            </p>
            <p className="text-2xl font-bold">{stats.categories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
            <p className="text-2xl font-bold">{stats.failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              API Cost
            </p>
            <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
          </CardContent>
        </Card>
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

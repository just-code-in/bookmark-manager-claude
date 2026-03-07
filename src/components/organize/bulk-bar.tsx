"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BulkBarProps {
  selectedCount: number;
  categories: { name: string }[];
  onBulkAction: (
    action: "keep" | "archive" | "delete" | "move",
    category?: string,
  ) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkBar({
  selectedCount,
  categories,
  onBulkAction,
  onClearSelection,
}: BulkBarProps) {
  const [moveTarget, setMoveTarget] = useState("");

  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-950">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {selectedCount} selected
      </span>

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => onBulkAction("keep")}
      >
        Keep all
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={() => onBulkAction("archive")}
      >
        Archive all
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
        onClick={() => onBulkAction("delete")}
      >
        Delete all
      </Button>

      {categories.length > 0 && (
        <div className="flex items-center gap-1">
          <select
            value={moveTarget}
            onChange={(e) => setMoveTarget(e.target.value)}
            className="h-7 rounded-md border border-input bg-transparent px-2 text-xs"
          >
            <option value="">Move to category…</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {moveTarget && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                onBulkAction("move", moveTarget);
                setMoveTarget("");
              }}
            >
              Move
            </Button>
          )}
        </div>
      )}

      <button
        onClick={onClearSelection}
        className="ml-auto text-xs text-blue-500 hover:underline dark:text-blue-400"
      >
        Clear selection
      </button>
    </div>
  );
}

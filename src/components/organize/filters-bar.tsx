"use client";

import { Input } from "@/components/ui/input";

export interface FilterState {
  status: string;
  action: string;
  sort: string;
  query: string;
}

interface FiltersBarProps {
  filters: FilterState;
  categories: { name: string; count: number }[];
  onChange: (filters: FilterState) => void;
}

export function FiltersBar({ filters, categories, onChange }: FiltersBarProps) {
  const set = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Input
        placeholder="Filter by title or URL…"
        value={filters.query}
        onChange={(e) => set("query", e.target.value)}
        className="h-8 w-56 text-sm"
      />

      <select
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground transition-colors hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">All statuses</option>
        <option value="live">Live</option>
        <option value="redirected">Redirected</option>
        <option value="dead">Dead</option>
        <option value="pending">Untested</option>
      </select>

      <select
        value={filters.action}
        onChange={(e) => set("action", e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground transition-colors hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">All actions</option>
        <option value="unreviewed">Unreviewed</option>
        <option value="keep">Keep</option>
        <option value="archive">Archive</option>
        <option value="delete">Delete</option>
      </select>

      <select
        value={filters.sort}
        onChange={(e) => set("sort", e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground transition-colors hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="dateAdded">Date added</option>
        <option value="title">Title</option>
        <option value="category">Category</option>
      </select>
    </div>
  );
}

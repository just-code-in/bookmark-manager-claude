"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsPanel, type OrganizeStats } from "@/components/organize/stats-panel";
import { CategorySidebar } from "@/components/organize/category-sidebar";
import { FiltersBar, type FilterState } from "@/components/organize/filters-bar";
import { BulkBar } from "@/components/organize/bulk-bar";
import {
  BookmarkCard,
  type OrganizeBookmark,
  type BookmarkUpdate,
} from "@/components/organize/bookmark-card";

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

type RawBookmark = {
  id: number;
  url: string;
  title: string;
  folderPath: string | null;
  dateAdded: string | null;
  urlStatus: string;
  redirectUrl: string | null;
  httpStatusCode: number | null;
  urlError: string | null;
  category: string | null;
  tags: string | null;
  summary: string | null;
  triageStatus: string;
  userAction: string;
};

export default function OrganizePage() {
  const [bookmarks, setBookmarks] = useState<OrganizeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    action: "",
    sort: "dateAdded",
    query: "",
  });

  // Load all bookmarks on mount
  const loadBookmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks");
      const data = await res.json();
      const parsed: OrganizeBookmark[] = (data.bookmarks as RawBookmark[]).map(
        (b) => ({
          ...b,
          tags: parseTags(b.tags),
          userAction: (b.userAction as OrganizeBookmark["userAction"]) ?? "unreviewed",
        }),
      );
      setBookmarks(parsed);
    } catch (e) {
      console.error("Failed to load bookmarks", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Derive stats from bookmarks
  const stats = useMemo<OrganizeStats>(() => {
    let total = 0, live = 0, redirected = 0, dead = 0, pending = 0, triaged = 0;
    const byAction = { unreviewed: 0, keep: 0, archive: 0, delete: 0 };

    for (const b of bookmarks) {
      total++;
      if (b.urlStatus === "live") live++;
      else if (b.urlStatus === "redirected") redirected++;
      else if (b.urlStatus === "dead") dead++;
      else pending++;
      if (b.triageStatus === "completed") triaged++;
      byAction[b.userAction]++;
    }

    const reviewed = byAction.keep + byAction.archive + byAction.delete;
    return {
      total, live, redirected, dead, pending, triaged, byAction,
      percentReviewed: total > 0 ? Math.round((reviewed / total) * 100) : 0,
    };
  }, [bookmarks]);

  // Derive categories from bookmarks
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookmarks) {
      if (b.category) {
        map.set(b.category, (map.get(b.category) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [bookmarks]);

  // Filtered + sorted bookmarks
  const displayed = useMemo(() => {
    let result = bookmarks;

    if (selectedCategory !== null) {
      result = result.filter((b) => b.category === selectedCategory);
    }
    if (filters.status) {
      result = result.filter((b) => b.urlStatus === filters.status);
    }
    if (filters.action) {
      result = result.filter((b) => b.userAction === filters.action);
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q),
      );
    }

    const sorted = [...result];
    if (filters.sort === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sort === "category") {
      sorted.sort((a, b) => (a.category ?? "").localeCompare(b.category ?? ""));
    } else {
      // dateAdded descending (nulls last)
      sorted.sort((a, b) => {
        const da = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const db = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return db - da;
      });
    }
    return sorted;
  }, [bookmarks, selectedCategory, filters]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateBookmark = useCallback(async (id: number, updates: BookmarkUpdate) => {
    // Optimistic update
    setBookmarks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          ...(updates.userAction !== undefined && { userAction: updates.userAction }),
          ...(updates.category !== undefined && { category: updates.category }),
          ...(updates.tags !== undefined && { tags: updates.tags }),
          ...(updates.summary !== undefined && { summary: updates.summary }),
        };
      }),
    );

    const payload: Record<string, unknown> = {};
    if (updates.userAction !== undefined) payload.userAction = updates.userAction;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.summary !== undefined) payload.summary = updates.summary;

    await fetch(`/api/bookmarks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }, []);

  const bulkAction = useCallback(
    async (action: "keep" | "archive" | "delete" | "move", category?: string) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      const payload: Record<string, unknown> = { ids };
      if (action !== "move") payload.userAction = action;
      if (action === "move" && category) payload.category = category;

      // Optimistic
      setBookmarks((prev) =>
        prev.map((b) => {
          if (!selectedIds.has(b.id)) return b;
          if (action === "move") return { ...b, category: category ?? null };
          return { ...b, userAction: action };
        }),
      );

      await fetch("/api/bookmarks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSelectedIds(new Set());
    },
    [selectedIds],
  );

  const renameCategory = useCallback(async (name: string, newName: string) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.category === name ? { ...b, category: newName } : b)),
    );
    if (selectedCategory === name) setSelectedCategory(newName);

    await fetch(`/api/categories/${encodeURIComponent(name)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newName }),
    });
  }, [selectedCategory]);

  const deleteCategory = useCallback(async (name: string) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.category === name ? { ...b, category: null } : b)),
    );
    if (selectedCategory === name) setSelectedCategory(null);

    await fetch(`/api/categories/${encodeURIComponent(name)}`, { method: "DELETE" });
  }, [selectedCategory]);

  const mergeCategory = useCallback(async (from: string, to: string) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.category === from ? { ...b, category: to } : b)),
    );
    if (selectedCategory === from) setSelectedCategory(to);

    await fetch("/api/categories/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to }),
    });
  }, [selectedCategory]);

  const handleSelect = useCallback((id: number, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    if (selectedIds.size === displayed.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayed.map((b) => b.id)));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-sm text-gray-500">Loading bookmarks…</p>
        </div>
      </main>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">&larr; Home</Link>
          <h1 className="mt-1 text-2xl font-bold">Organise</h1>
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No bookmarks imported yet.</p>
              <Link href="/import" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                Import your bookmarks &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            &larr; Home
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Organise</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Browse by category, manage triage actions, and edit AI-generated metadata
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <StatsPanel stats={stats} />
        </div>

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Category sidebar */}
          <aside className="w-52 shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-3">
                <CategorySidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  totalCount={bookmarks.length}
                  onSelectCategory={setSelectedCategory}
                  onRenameCategory={renameCategory}
                  onDeleteCategory={deleteCategory}
                  onMergeCategory={mergeCategory}
                />
              </CardContent>
            </Card>
          </aside>

          {/* Bookmark list */}
          <div className="min-w-0 flex-1 space-y-3">
            {/* Filters */}
            <FiltersBar
              filters={filters}
              categories={categories}
              onChange={setFilters}
            />

            {/* Bulk bar */}
            <BulkBar
              selectedCount={selectedIds.size}
              categories={categories}
              onBulkAction={bulkAction}
              onClearSelection={() => setSelectedIds(new Set())}
            />

            {/* Select all + count */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <button
                onClick={handleSelectAll}
                className="text-xs hover:text-gray-700 dark:hover:text-gray-300"
              >
                {selectedIds.size === displayed.length && displayed.length > 0
                  ? "Deselect all"
                  : "Select all"}
              </button>
              <span>{displayed.length} bookmark{displayed.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Cards */}
            {displayed.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  No bookmarks match the current filters.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {displayed.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    categories={categories}
                    isSelected={selectedIds.has(bookmark.id)}
                    onSelect={handleSelect}
                    onUpdate={updateBookmark}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

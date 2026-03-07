"use client";

import { useState } from "react";
import { Pencil, Check, X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export interface OrganizeBookmark {
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
  tags: string[];
  summary: string | null;
  triageStatus: string;
  userAction: "unreviewed" | "keep" | "archive" | "delete";
}

export interface BookmarkUpdate {
  userAction?: "unreviewed" | "keep" | "archive" | "delete";
  category?: string | null;
  tags?: string[];
  summary?: string;
}

interface BookmarkCardProps {
  bookmark: OrganizeBookmark;
  categories: { name: string }[];
  isSelected: boolean;
  onSelect: (id: number, selected: boolean) => void;
  onUpdate: (id: number, updates: BookmarkUpdate) => Promise<void>;
}

const statusColors: Record<string, string> = {
  live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  redirected: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  dead: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const actionColors: Record<string, string> = {
  keep: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  unreviewed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function BookmarkCard({
  bookmark,
  categories,
  isSelected,
  onSelect,
  onUpdate,
}: BookmarkCardProps) {
  const [editingField, setEditingField] = useState<"summary" | "tags" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingCategory, setEditingCategory] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = (field: "summary" | "tags") => {
    setEditingField(field);
    setEditValue(
      field === "summary"
        ? (bookmark.summary ?? "")
        : bookmark.tags.join(", "),
    );
  };

  const saveEdit = async () => {
    if (editingField === null) return;
    setSaving(true);
    try {
      if (editingField === "summary") {
        await onUpdate(bookmark.id, { summary: editValue });
      } else {
        const tags = editValue
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        await onUpdate(bookmark.id, { tags });
      }
    } finally {
      setEditingField(null);
      setSaving(false);
    }
  };

  const cancelEdit = () => setEditingField(null);

  const handleCategoryChange = async (category: string) => {
    setEditingCategory(false);
    await onUpdate(bookmark.id, { category: category || null });
  };

  const handleAction = async (action: "keep" | "archive" | "delete") => {
    const next = bookmark.userAction === action ? "unreviewed" : action;
    await onUpdate(bookmark.id, { userAction: next });
  };

  const displayStatus = bookmark.urlStatus === "pending" ? "untested" : bookmark.urlStatus;

  return (
    <div
      className={`rounded-lg border bg-[var(--background)] p-4 transition-colors ${
        isSelected ? "border-blue-400 dark:border-blue-600" : "border-gray-200 dark:border-gray-800"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(bookmark.id, !!checked)}
          className="mt-0.5 shrink-0"
        />

        <div className="min-w-0 flex-1">
          {/* Title + external link */}
          <div className="flex items-start justify-between gap-2">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 font-medium hover:underline"
            >
              <span className="line-clamp-1">{bookmark.title}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60" />
            </a>

            {/* Action buttons */}
            <div className="flex shrink-0 gap-1">
              <ActionBtn
                label="Keep"
                active={bookmark.userAction === "keep"}
                activeClass="bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                onClick={() => handleAction("keep")}
              />
              <ActionBtn
                label="Archive"
                active={bookmark.userAction === "archive"}
                activeClass="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700"
                onClick={() => handleAction("archive")}
              />
              <ActionBtn
                label="Delete"
                active={bookmark.userAction === "delete"}
                activeClass="bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700"
                onClick={() => handleAction("delete")}
              />
            </div>
          </div>

          {/* URL */}
          <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
            {bookmark.url}
          </p>

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              className={statusColors[bookmark.urlStatus] ?? statusColors.pending}
            >
              {displayStatus}
            </Badge>

            {bookmark.userAction !== "unreviewed" && (
              <Badge
                variant="secondary"
                className={actionColors[bookmark.userAction]}
              >
                {bookmark.userAction}
              </Badge>
            )}

            {/* Category */}
            {editingCategory ? (
              <select
                autoFocus
                defaultValue={bookmark.category ?? ""}
                onChange={(e) => handleCategoryChange(e.target.value)}
                onBlur={() => setEditingCategory(false)}
                className="h-6 rounded border border-input bg-[var(--background)] px-1 text-xs"
              >
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setEditingCategory(true)}
                title="Click to change category"
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                >
                  {bookmark.category ?? "Uncategorised"}
                </Badge>
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="mt-2">
            {editingField === "summary" ? (
              <div className="space-y-1">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={3}
                  className="text-xs"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    size="xs"
                    onClick={saveEdit}
                    disabled={saving}
                  >
                    <Check className="h-3 w-3" />
                    Save
                  </Button>
                  <Button size="xs" variant="outline" onClick={cancelEdit}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : bookmark.summary ? (
              <div className="group flex items-start gap-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {bookmark.summary}
                </p>
                <button
                  onClick={() => startEdit("summary")}
                  className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-60"
                  title="Edit summary"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            ) : bookmark.triageStatus === "completed" ? (
              <button
                onClick={() => startEdit("summary")}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                + Add summary
              </button>
            ) : null}
          </div>

          {/* Tags */}
          <div className="mt-1.5">
            {editingField === "tags" ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="group flex flex-wrap items-center gap-1">
                {bookmark.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {tag}
                  </Badge>
                ))}
                <button
                  onClick={() => startEdit("tags")}
                  className="opacity-0 group-hover:opacity-60"
                  title="Edit tags"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActionBtnProps {
  label: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}

function ActionBtn({ label, active, activeClass, onClick }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
        active
          ? activeClass
          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

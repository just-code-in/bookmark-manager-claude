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
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  redirected: "border-amber-200 bg-amber-50 text-amber-600",
  dead: "border-red-200 bg-red-50 text-destructive",
  pending: "border-border bg-muted text-muted-foreground",
};

const actionColors: Record<string, string> = {
  keep: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archive: "border-amber-200 bg-amber-50 text-amber-600",
  delete: "border-red-200 bg-red-50 text-destructive",
  unreviewed: "border-border bg-muted text-muted-foreground",
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
      className={`rounded-lg border bg-card p-4 transition-all duration-150 ${
        isSelected
          ? "border-primary/40 shadow-[0_0_0_3px_oklch(0.205_0_0/0.06)]"
          : "border-border hover:shadow-[0_1px_4px_0_oklch(0_0_0/0.05)]"
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
                activeClass="border-emerald-200 bg-emerald-50 text-emerald-700"
                onClick={() => handleAction("keep")}
              />
              <ActionBtn
                label="Archive"
                active={bookmark.userAction === "archive"}
                activeClass="border-amber-200 bg-amber-50 text-amber-600"
                onClick={() => handleAction("archive")}
              />
              <ActionBtn
                label="Delete"
                active={bookmark.userAction === "delete"}
                activeClass="border-red-200 bg-red-50 text-destructive"
                onClick={() => handleAction("delete")}
              />
            </div>
          </div>

          {/* URL */}
          <p className="mt-0.5 truncate text-xs text-muted-foreground/60">
            {bookmark.url}
          </p>

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={statusColors[bookmark.urlStatus] ?? statusColors.pending}
            >
              {displayStatus}
            </Badge>

            {bookmark.userAction !== "unreviewed" && (
              <Badge
                variant="outline"
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
                  variant="outline"
                  className="cursor-pointer border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
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
                <p className="text-xs text-muted-foreground leading-relaxed">
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
                className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
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
                    className="px-1.5 py-0 text-[10px] text-muted-foreground border-border/60"
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
      className={`rounded border px-2 py-0.5 text-xs font-medium transition-all duration-150 ${
        active
          ? activeClass
          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

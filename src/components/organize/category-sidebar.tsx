"use client";

import { useState } from "react";
import { Pencil, Trash2, GitMerge, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export interface CategoryItem {
  name: string;
  count: number;
}

interface CategorySidebarProps {
  categories: CategoryItem[];
  selectedCategory: string | null;
  totalCount: number;
  onSelectCategory: (name: string | null) => void;
  onRenameCategory: (name: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
  onMergeCategory: (from: string, to: string) => Promise<void>;
}

export function CategorySidebar({
  categories,
  selectedCategory,
  totalCount,
  onSelectCategory,
  onRenameCategory,
  onDeleteCategory,
  onMergeCategory,
}: CategorySidebarProps) {
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [mergingFrom, setMergingFrom] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");

  const handleRenameStart = (name: string) => {
    setRenamingCategory(name);
    setRenameValue(name);
  };

  const handleRenameSave = async () => {
    if (!renamingCategory || !renameValue.trim()) return;
    await onRenameCategory(renamingCategory, renameValue.trim());
    setRenamingCategory(null);
  };

  const handleMergeSave = async () => {
    if (!mergingFrom || !mergeTarget) return;
    await onMergeCategory(mergingFrom, mergeTarget);
    setMergingFrom(null);
    setMergeTarget("");
  };

  return (
    <div className="space-y-1">
      {/* All bookmarks */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
          selectedCategory === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <span>All bookmarks</span>
        <span className="text-xs opacity-70">{totalCount}</span>
      </button>

      {/* Category list */}
      {categories.map((cat) => (
        <div key={cat.name} className="group relative">
          {renamingCategory === cat.name ? (
            <div className="flex items-center gap-1 px-1">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-7 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSave();
                  if (e.key === "Escape") setRenamingCategory(null);
                }}
              />
              <button
                onClick={handleRenameSave}
                className="shrink-0 text-green-600 hover:text-green-700"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setRenamingCategory(null)}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                selectedCategory === cat.name
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <button
                className="flex-1 text-left"
                onClick={() => onSelectCategory(cat.name)}
              >
                <span className="block max-w-[130px] truncate">{cat.name}</span>
              </button>
              <div className="flex items-center gap-1">
                <span className="text-xs opacity-60">{cat.count}</span>
                <div className="hidden items-center gap-0.5 group-hover:flex">
                  <button
                    title="Rename"
                    onClick={() => handleRenameStart(cat.name)}
                    className="rounded p-0.5 opacity-60 hover:opacity-100"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {/* Merge dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        title="Merge into another category"
                        onClick={() => {
                          setMergingFrom(cat.name);
                          setMergeTarget("");
                        }}
                        className="rounded p-0.5 opacity-60 hover:opacity-100"
                      >
                        <GitMerge className="h-3 w-3" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Merge category</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Move all bookmarks from{" "}
                        <strong>{cat.name}</strong> into:
                      </p>
                      <select
                        value={mergeTarget}
                        onChange={(e) => setMergeTarget(e.target.value)}
                        className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      >
                        <option value="">Select target category…</option>
                        {categories
                          .filter((c) => c.name !== cat.name)
                          .map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.count})
                            </option>
                          ))}
                      </select>
                      <div className="mt-4 flex justify-end gap-2">
                        <DialogClose asChild>
                          <Button variant="outline" size="sm">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button
                            size="sm"
                            disabled={!mergeTarget}
                            onClick={handleMergeSave}
                          >
                            Merge
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {/* Delete dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        title="Remove category"
                        className="rounded p-0.5 text-red-400 opacity-60 hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove category</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Remove <strong>{cat.name}</strong>? The {cat.count}{" "}
                        bookmark{cat.count !== 1 ? "s" : ""} in this category
                        will become uncategorised.
                      </p>
                      <div className="mt-4 flex justify-end gap-2">
                        <DialogClose asChild>
                          <Button variant="outline" size="sm">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteCategory(cat.name)}
                          >
                            Remove
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {categories.length === 0 && (
        <p className="px-3 py-4 text-xs text-gray-400">
          No categories yet. Run AI Triage first.
        </p>
      )}
    </div>
  );
}

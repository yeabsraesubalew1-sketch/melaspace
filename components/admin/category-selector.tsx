"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import ManageCategoriesPopover from "./manage-categories-popover";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SettingsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.65h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9V9c0 .67.4 1.27 1.02 1.54H21a2 2 0 1 1 0 4h-.58A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3 w-3 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3 w-3 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function CategorySelector({
  selected,
  onChange,
  onLoaded,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  onLoaded?: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showInput, setShowInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [manageOpen, setManageOpen] = useState(false);

  const addInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories?all=true");
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
      onLoaded?.();
    }
  }, [onLoaded]);

  useEffect(() => {
    void fetchCategories();

    const handleRefresh = (e: Event) => {
      const customEvent = e as CustomEvent<Category[] | Category | undefined>;
      if (customEvent.detail) {
        const incoming = Array.isArray(customEvent.detail)
          ? customEvent.detail
          : [customEvent.detail];
        setCategories((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const additions = incoming.filter(
            (c) => c && c._id && !existingIds.has(c._id)
          );
          if (additions.length === 0) return prev;
          return [...prev, ...additions];
        });
      }
      void fetchCategories();
    };
    window.addEventListener("refresh-categories", handleRefresh);
    return () => window.removeEventListener("refresh-categories", handleRefresh);
  }, [fetchCategories]);

  // Focus add input when opened
  useEffect(() => {
    if (showInput) {
      setTimeout(() => addInputRef.current?.focus(), 50);
    }
  }, [showInput]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((c) => c !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  async function createCategory(nameOverride?: string) {
    const targetName = (nameOverride ?? newCategory).trim();
    if (!targetName || isCreating) return;

    try {
      setIsCreating(true);
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to create category");
        return;
      }

      const created: Category = data.data;

      // Ensure local state contains the category
      setCategories((prev) => {
        if (prev.some((c) => c._id === created._id)) return prev;
        return [...prev, created];
      });

      // Auto-select the newly created or existing matched category
      if (!selected.includes(created._id)) {
        onChange([...selected, created._id]);
      }

      toast.success(
        data.alreadyExisted ? `Linked "${created.name}"` : `Created "${created.name}"`
      );

      setNewCategory("");
      setShowInput(false);
      setSearchQuery("");
    } catch (err) {
      console.error("Create category error:", err);
      toast.error("Failed to create category");
    } finally {
      setIsCreating(false);
    }
  }

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Selected category objects
  const selectedCategoryDocs = useMemo(() => {
    const map = new Map(categories.map((c) => [c._id, c]));
    return selected.map((id) => map.get(id)).filter(Boolean) as Category[];
  }, [categories, selected]);

  return (
    <div className="space-y-3">
      {/* Action Header & Tools */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground/70">
            {selected.length > 0
              ? `${selected.length} selected`
              : "Select categories"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Add Category Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setShowInput((prev) => !prev);
              if (!showInput) setSearchQuery("");
            }}
            title={showInput ? "Cancel" : "Add category"}
            aria-label="Add category"
            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              showInput
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-surface-muted/60 text-foreground/70 hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <PlusIcon />
          </button>

          {/* Manage Categories Button */}
          <button
            type="button"
            onClick={() => setManageOpen(true)}
            title="Manage all categories"
            aria-label="Manage all categories"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-muted/60 text-foreground/70 transition-colors hover:bg-surface-muted hover:text-foreground cursor-pointer"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* Manual Add Input Box (Guaranteed never to overflow) */}
      {showInput && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createCategory();
          }}
          className="flex w-full items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-1.5 transition-all"
        >
          <input
            ref={addInputRef}
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name..."
            className="min-w-0 flex-1 rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />

          <button
            type="submit"
            disabled={!newCategory.trim() || isCreating}
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
          >
            {isCreating ? "Adding..." : "Add"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowInput(false);
              setNewCategory("");
            }}
            className="inline-flex shrink-0 items-center justify-center rounded-md p-1 text-foreground/60 transition-colors hover:bg-surface-muted hover:text-foreground cursor-pointer"
            title="Cancel"
          >
            <CloseIcon />
          </button>
        </form>
      )}

      {/* Selected Categories Chips Row (Quick View) */}
      {selectedCategoryDocs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-surface-muted/30 p-2">
          {selectedCategoryDocs.map((cat) => (
            <span
              key={cat._id}
              className="inline-flex items-center gap-1 rounded-md border border-foreground/80 bg-foreground px-2 py-0.5 text-[11px] font-medium text-background shadow-2xs"
            >
              <span>{cat.name}</span>
              <button
                type="button"
                onClick={() => toggle(cat._id)}
                className="hover:opacity-75 cursor-pointer ml-0.5"
                title={`Remove ${cat.name}`}
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter / Search Bar (Only shown when categories > 5) */}
      {categories.length > 5 && (
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-2.5 flex items-center justify-center text-foreground/40">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-border/80 bg-background py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-foreground/40 outline-none transition focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 flex items-center justify-center text-foreground/40 hover:text-foreground cursor-pointer"
              title="Clear search"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      )}

      {/* Categories Scrollable Pill Cloud */}
      <div className="max-h-52 overflow-y-auto pr-1 space-y-1.5 rounded-lg">
        {loading ? (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-7 w-24 animate-pulse rounded-full bg-surface-muted"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/80 p-3 text-center">
            <p className="text-xs text-foreground/60 mb-2">
              No categories match &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => void createCategory(searchQuery)}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-emerald-700 cursor-pointer"
            >
              <PlusIcon className="h-3 w-3" />
              <span>Create &ldquo;{searchQuery}&rdquo;</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {filteredCategories.map((cat) => {
              const isSelected = selected.includes(cat._id);
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => toggle(cat._id)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all cursor-pointer select-none border ${
                    isSelected
                      ? "border-foreground bg-foreground text-background font-medium shadow-2xs"
                      : "border-border/70 bg-surface-muted/40 text-foreground/80 hover:border-border hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  {isSelected ? (
                    <CheckIcon className="h-3 w-3 text-background" />
                  ) : (
                    <span className="text-foreground/40 font-light">+</span>
                  )}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Popover for Editing & Deleting Categories */}
      {manageOpen && (
        <ManageCategoriesPopover
          categories={categories}
          setCategories={setCategories}
          onDelete={(id) =>
            onChange(selected.filter((categoryId) => categoryId !== id))
          }
          close={() => setManageOpen(false)}
        />
      )}
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3.5 w-3.5 text-foreground/70"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3.5 w-3.5 text-rose-500"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3.5 w-3.5 text-foreground/40"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function ManageCategoriesPopover({
  categories,
  setCategories,
  onDelete,
  close,
}: {
  categories: Category[];
  setCategories: (c: Category[]) => void;
  onDelete: (id: string) => void;
  close: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  async function updateCategory(id: string) {
    if (!value.trim() || saving) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: value.trim() }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to update category");
        return;
      }

      toast.success("Category updated");
      setCategories(categories.map((c) => (c._id === id ? data.data : c)));
      setEditing(null);
    } catch {
      toast.error("Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Are you sure you want to delete this category? Any associated blogs will be reassigned to 'Other'.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to delete category");
        return;
      }

      toast.success("Category deleted");
      setCategories(categories.filter((c) => c._id !== id));
      onDelete(id);
    } catch {
      toast.error("Failed to delete category");
    }
  }

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 py-6 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={close}
    >
      <div
        className={`flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-background p-5 shadow-2xl transition-all duration-200 ${
          visible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Manage Categories
            </h2>
            <p className="text-xs text-foreground/50">
              {categories.length} total categories
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-foreground/50 hover:bg-surface-muted hover:text-foreground transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter input */}
        {categories.length > 5 && (
          <div className="relative my-3 flex items-center">
            <div className="pointer-events-none absolute left-2.5 flex items-center justify-center text-foreground/40">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter categories..."
              className="w-full rounded-lg border border-border bg-surface-muted/40 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-foreground/30 focus:bg-background"
            />
          </div>
        )}

        {/* Categories list */}
        <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-border/40 pr-1 my-2">
          {filteredCategories.length === 0 ? (
            <p className="py-8 text-center text-xs text-foreground/50">
              No categories match your search.
            </p>
          ) : (
            filteredCategories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-surface-muted/20 px-2 rounded-lg"
              >
                {editing === cat._id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void updateCategory(cat._id);
                    }}
                    className="flex flex-1 items-center gap-2"
                  >
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      autoFocus
                      className="min-w-0 flex-1 rounded-md border border-foreground/30 bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-foreground/30"
                    />
                    <button
                      type="submit"
                      disabled={saving || !value.trim()}
                      className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
                    >
                      {saving ? "..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs text-foreground/70 transition hover:bg-surface-muted/80 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-xs font-medium text-foreground">
                        {cat.name}
                      </span>
                      <span className="truncate text-[10px] text-foreground/40">
                        slug: {cat.slug}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(cat._id);
                          setValue(cat.name);
                        }}
                        aria-label={`Edit ${cat.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-muted/60 transition-colors hover:bg-surface-muted cursor-pointer"
                      >
                        <EditIcon />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCategory(cat._id)}
                        aria-label={`Delete ${cat.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 transition-colors hover:bg-rose-500/20 cursor-pointer"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-border bg-surface-muted px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted/80 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
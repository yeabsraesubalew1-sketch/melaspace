"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ManageCategoriesPopover from "./manage-categories-popover";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

function AddIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 text-admin-icon"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 text-admin-icon"
      aria-hidden="true"
    >
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.4a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.65h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9V9c0 .67.4 1.27 1.02 1.54H21a2 2 0 1 1 0 4h-.58A1.7 1.7 0 0 0 19.4 15Z" />
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
  const [manageOpen, setManageOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/categories");
      const data = await res.json();

      if (data.success) {
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
  }, [fetchCategories]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((c) => c !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  async function createCategory() {
    if (!newCategory.trim()) return;

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: newCategory }),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.error);
      return;
    }

    toast.success("Category created");

    setCategories((prev) => [...prev, data.data]);

    // auto select the new category
    onChange([...selected, data.data._id]);

    setNewCategory("");
    setShowInput(false);
  }

  return (
    <div className="space-y-3">

      <div className="flex flex-wrap gap-3">

        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-28 animate-pulse rounded-md bg-surface-muted"
            />
          ))}

        {!loading &&
          categories.map((cat) => (
            <label
              key={cat._id}
              className="flex items-center gap-3 cursor-pointer rounded-md border-x border-admin-chip-border bg-admin-chip-bg px-3 py-2"
            >
              <input
                type="checkbox"
                checked={selected.includes(cat._id)}
                onChange={() => toggle(cat._id)}
                className="h-5 w-5 cursor-pointer rounded border-2 border-admin-check-border accent-admin-check-fill"
              />

              {cat.name}
            </label>
          ))}

        {!loading && (
          <>
            <button
              onClick={() => setShowInput(true)}
              aria-label="Add category"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-admin-control-border bg-admin-control-bg transition-colors hover:bg-admin-control-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-muted-btn-ring cursor-pointer"
            >
              <AddIcon />
            </button>

            <button
              onClick={() => setManageOpen(!manageOpen)}
              title="Manage categories"
              aria-label="Manage categories"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-admin-control-border bg-admin-control-bg transition-colors hover:bg-admin-control-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-muted-btn-ring cursor-pointer"
            >
              <SettingsIcon />
            </button>
          </>
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          showInput
            ? "max-h-20 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-2"
        }`}
      >
        <div className="flex gap-2 pt-1">

          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category"
            className="rounded border border-admin-input-border px-3 py-2 outline-none transition-colors focus:border-admin-input-border-active"
          />

          <button
            onClick={createCategory}
            className="rounded-md bg-admin-success px-4 py-2 text-white transition-colors hover:bg-admin-success-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-success-ring cursor-pointer"
          >
            Add
          </button>

          <button
            onClick={() => setShowInput(false)}
            className="rounded-md border border-admin-muted-btn-border bg-admin-muted-btn-bg px-4 py-2 transition-colors hover:bg-admin-muted-btn-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-muted-btn-ring cursor-pointer"
          >
            Cancel
          </button>

        </div>
      </div>

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
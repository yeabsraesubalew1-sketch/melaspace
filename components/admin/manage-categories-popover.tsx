"use client";

import { useEffect, useState } from "react";
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
      className="h-4 w-4 text-admin-icon"
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
      className="h-4 w-4 text-admin-danger"
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  async function updateCategory(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: value }),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.error);
      return;
    }

    toast.success("Category updated");

    setCategories(
      categories.map((c) =>
        c._id === id ? data.data : c
      )
    );

    setEditing(null);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete category?")) return;

    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.error);
      return;
    }

    toast.success("Category deleted");

    setCategories(categories.filter((c) => c._id !== id));
    onDelete(id);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={close}
    >
      <div
        className={`w-full max-w-xl rounded-xl border border-border bg-background p-5 shadow-xl transition-all duration-200 ${
          visible ? "scale-100" : "scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >

      {categories.map((cat) => (
        <div
          key={cat._id}
          className="flex items-center justify-between gap-3 py-2"
        >

          {editing === cat._id ? (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full flex-1 border-0 border-b border-admin-input-border bg-transparent px-1 py-1 outline-none focus:border-admin-input-border-active"
            />
          ) : (
            <span className="flex-1">{cat.name}</span>
          )}

          <div className="flex gap-2">

            {editing === cat._id ? (
              <>
                <button
                  onClick={() => updateCategory(cat._id)}
                  className="rounded-md bg-admin-success px-3 py-1.5 text-white transition-colors hover:bg-admin-success-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-success-ring cursor-pointer"
                >
                  Save
                </button>

                <button
                  onClick={() => setEditing(null)}
                  className="rounded-md border border-admin-muted-btn-border bg-admin-muted-btn-bg px-3 py-1.5 transition-colors hover:bg-admin-muted-btn-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-muted-btn-ring cursor-pointer"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditing(cat._id);
                    setValue(cat.name);
                  }}
                  aria-label="Edit category"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-admin-control-border bg-admin-control-bg transition-colors hover:bg-admin-control-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-muted-btn-ring cursor-pointer"
                >
                  <EditIcon />
                </button>

                <button
                  onClick={() => deleteCategory(cat._id)}
                  aria-label="Delete category"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-admin-danger-border bg-admin-danger-bg transition-colors hover:bg-admin-danger-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-danger-ring cursor-pointer"
                >
                  <DeleteIcon />
                </button>
              </>
            )}

          </div>

        </div>
      ))}

      <button
        onClick={close}
        className="mt-3 rounded-md border border-admin-muted-btn-border bg-admin-muted-btn-bg px-4 py-2 text-sm text-foreground transition-colors hover:bg-admin-muted-btn-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-muted-btn-ring cursor-pointer"
      >
        Close
      </button>

      </div>
    </div>
  );
}
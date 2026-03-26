"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Editor from "./Editor";
import CategorySelector from "./category-selector";
import type { OutputData } from "@editorjs/editorjs";

type BlogCategory = {
  _id: string;
};

type BlogEditorProps = {
  mode: "create" | "edit";
  blogId?: string;
};

export default function BlogEditor({ mode, blogId }: BlogEditorProps) {
  const router = useRouter();
  const [allowNextNavigation, setAllowNextNavigation] = useState(false);
  const shouldSyncInitialEditorContentRef = useRef(mode !== "edit");
  const loadedTitleRef = useRef("");
  const loadedCategoriesRef = useRef<string[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<OutputData>({ blocks: [] });
  const [categories, setCategories] = useState<string[]>([]);

  const [loadingBlog, setLoadingBlog] = useState(mode === "edit");
  const [saveAction, setSaveAction] = useState<"draft" | "publish" | null>(
    null
  );

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(
    JSON.stringify({
      title: "",
      content: { blocks: [] },
      categories: [],
    })
  );

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: title.trim(),
        content,
        categories: [...categories].sort(),
      }),
    [title, content, categories]
  );

  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;
  const canSaveDraft = title.trim().length > 0;
  const canPublish = title.trim().length > 0 && content.blocks.length > 0;
  const saving = saveAction !== null;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges || saving) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, saving]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges || saving || allowNextNavigation) {
        return;
      }

      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      const anchor = path.find(
        (node): node is HTMLAnchorElement =>
          node instanceof HTMLAnchorElement && node.hasAttribute("href")
      );

      if (!anchor) {
        return;
      }

      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const nextUrl = new URL(href, window.location.origin);
      const currentUrl = new URL(window.location.href);

      const isSamePath =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash;

      if (isSamePath) {
        return;
      }

      const confirmed = window.confirm(
        "You have unsaved changes. Leave this page anyway?"
      );

      if (!confirmed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [allowNextNavigation, hasUnsavedChanges, saving]);

  const handleCategoriesLoaded = useCallback(() => {
    setCategoriesLoading(false);
  }, []);

  const handleEditorChange = useCallback(
    (data: OutputData) => {
      setContent(data);

      if (mode !== "edit" || shouldSyncInitialEditorContentRef.current) {
        return;
      }

      setLastSavedSnapshot(
        JSON.stringify({
          title: loadedTitleRef.current.trim(),
          content: data,
          categories: [...loadedCategoriesRef.current].sort(),
        })
      );

      shouldSyncInitialEditorContentRef.current = true;
    },
    [mode]
  );

  useEffect(() => {
    if (mode !== "edit" || !blogId) return;

    if (!/^[a-f\d]{24}$/i.test(blogId)) {
      router.replace("/admin/blogs/new");
      return;
    }

    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/admin/blogs/${blogId}`);
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "Failed to fetch blog");
        }

        const blog = json.data;
        const normalizedTitle = blog.title?.trim() ?? "";
        const normalizedCategoryIds = (blog.categories as BlogCategory[])
          .map((category) => category._id)
          .sort();

        loadedTitleRef.current = normalizedTitle;
        loadedCategoriesRef.current = normalizedCategoryIds;
        shouldSyncInitialEditorContentRef.current = false;

        setTitle(blog.title);
        setContent(blog.content);
        setCategories(
          (blog.categories as BlogCategory[]).map((category) => category._id)
        );
        setLastSavedSnapshot(
          JSON.stringify({
            title: normalizedTitle,
            content: blog.content,
            categories: normalizedCategoryIds,
          })
        );
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error ? err.message : "Could not load this blog",
          { id: "blog-load-error" }
        );
        router.replace("/admin/blogs/new");
      } finally {
        setLoadingBlog(false);
      }
    };

    fetchBlog();
  }, [mode, blogId, router]);

  const handleSave = async (publish: boolean) => {
    if (publish && !canPublish) return;
    if (!publish && !canSaveDraft) return;

    setSaveAction(publish ? "publish" : "draft");

    try {
      if (mode === "edit" && !blogId) {
        throw new Error("Missing blog id for edit mode");
      }

      const payload = {
        title,
        content,
        categories,
        status: publish ? "published" : "draft",
      };

      const endpoint =
        mode === "create"
          ? "/api/admin/blogs"
          : `/api/admin/blogs/${blogId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        const errorMessage =
          json?.error || `Save failed (HTTP ${res.status})`;
        throw new Error(errorMessage);
      }

      const savedId =
        (json?.data?.id as string | undefined) ??
        (mode === "edit" ? blogId : undefined);

      setLastSavedSnapshot(currentSnapshot);
      setAllowNextNavigation(true);

      toast.success(publish ? "Blog published" : "Draft saved");

      if (!publish && savedId) {
        router.push(`/admin/blogs/${savedId}/preview`);
      } else if (publish) {
        router.push("/admin/blogs/publishes");
      } else {
        router.push("/admin/blogs");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save blog");
    } finally {
      setSaveAction(null);
    }
  };

  if (loadingBlog) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-2/3 bg-surface-muted rounded-lg" />
        <div className="h-64 bg-surface-muted rounded-xl" />
        <div className="h-12 w-48 bg-surface-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/60">
          Title
        </p>
        <input
          className="input w-full text-lg font-semibold"
          placeholder="Blog title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <Editor initialData={content} onChange={handleEditorChange} />

      <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/60">
          Categories
        </p>
        {categoriesLoading && (
          <div className="h-10 w-64 rounded-lg bg-surface-muted animate-pulse" />
        )}

        <CategorySelector
          selected={categories}
          onChange={setCategories}
          onLoaded={handleCategoriesLoaded}
        />
      </div>

      <div className="sticky bottom-4 z-20 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            {saving
              ? "Saving changes..."
              : hasUnsavedChanges
                ? "Unsaved changes"
                : "All changes saved"}
          </p>

          <div className="flex gap-3">
            <button
              className="btn btn-secondary"
              disabled={!canSaveDraft || saving}
              onClick={() => handleSave(false)}
            >
              {saveAction === "draft" ? "Saving Draft..." : "Draft & Preview"}
            </button>

            <button
              className="btn btn-primary"
              disabled={!canPublish || saving}
              onClick={() => handleSave(true)}
            >
              {saveAction === "publish" ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
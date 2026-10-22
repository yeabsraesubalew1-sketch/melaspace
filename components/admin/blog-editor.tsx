"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Editor from "./Editor";
import CategorySelector from "./category-selector";
import ResourceSelector from "./ResourceSelector";
import FeaturedImageUploader from "./FeaturedImageUploader";
import type { OutputData } from "@editorjs/editorjs";
import type { FeaturedImage, ResourceItem } from "@/types/api";

type BlogCategory = {
  _id: string;
};

type BlogEditorProps = {
  mode: "create" | "edit";
  blogId?: string;
};

function extractSnippet(data: OutputData): string {
  if (!data?.blocks || !Array.isArray(data.blocks)) return "";
  for (const block of data.blocks) {
    if (block.type === "paragraph" && block.data?.text) {
      const stripped = block.data.text.replace(/<[^>]+>/g, "").trim();
      if (stripped.length > 10) {
        return stripped.slice(0, 160);
      }
    }
  }
  return "";
}

export default function BlogEditor({ mode, blogId }: BlogEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [allowNextNavigation, setAllowNextNavigation] = useState(false);
  const shouldSyncInitialEditorContentRef = useRef(mode !== "edit");
  const loadedTitleRef = useRef("");
  const loadedCategoriesRef = useRef<string[]>([]);

  const [title, setTitle] = useState(() => (mode === "create" ? searchParams.get("title") || "" : ""));
  const [excerpt, setExcerpt] = useState(() => (mode === "create" ? searchParams.get("excerpt") || "" : ""));
  const [content, setContent] = useState<OutputData>({ blocks: [] });
  const [featuredImage, setFeaturedImage] = useState<FeaturedImage | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [linkedResourceIds, setLinkedResourceIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [authorData, setAuthorData] = useState<{
    author?: { _id?: string; name?: string; email?: string; role?: string } | string;
    authorName?: string;
    lastEditedBy?: { _id?: string; name?: string; email?: string; role?: string } | string;
  } | null>(null);

  const [loadingBlog, setLoadingBlog] = useState(mode === "edit");
  const [saveAction, setSaveAction] = useState<"draft" | "publish" | null>(
    null
  );

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(
    JSON.stringify({
      title: "",
      excerpt: "",
      content: { blocks: [] },
      featuredImage: null,
      categories: [],
      linkedResourceIds: [],
      isPinned: false,
      isAnonymous: false,
    })
  );

  const canPin = ["root_admin", "super_admin"].includes(session?.user?.role || "");
  const isAdminRole = ["root_admin", "super_admin", "manager"].includes(session?.user?.role || "");

  const handleResourceMentioned = useCallback((resource: ResourceItem) => {
    setLinkedResourceIds((prev) => {
      if (prev.includes(resource.id)) return prev;
      return [...prev, resource.id];
    });
    toast.success(`Attached "${resource.title}" to this article`, {
      id: `mention-resource-${resource.id}`,
      duration: 2500,
    });
  }, []);

  const authorUserId =
    authorData?.author && typeof authorData.author === "object"
      ? authorData.author._id
      : authorData?.author;
  const isAuthor = Boolean(authorUserId && authorUserId === session?.user?.id);
  const isRootAdmin = session?.user?.role === "root_admin";
  const canChangeAttribution = mode === "create" || isAuthor || isRootAdmin;
  const isTeamPost =
    authorData?.authorName === "Mela Team" ||
    (Boolean(isAnonymous) && authorData?.authorName !== "Anonymous");

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        featuredImage: featuredImage ? featuredImage.url : null,
        categories: [...categories].sort(),
        linkedResourceIds: [...linkedResourceIds].sort(),
        isPinned,
        isAnonymous,
      }),
    [title, excerpt, content, featuredImage, categories, linkedResourceIds, isPinned, isAnonymous]
  );

  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;
  const canSaveDraft = title.trim().length > 0;
  const canPublish = title.trim().length > 0 && content.blocks.length > 0;
  const saving = saveAction !== null;

  // SEO Health indicator calculations
  const excerptLength = excerpt.length;
  const wordCount = excerpt.trim() ? excerpt.trim().split(/\s+/).length : 0;

  const seoStatus = useMemo(() => {
    if (excerptLength === 0) {
      return {
        label: "No excerpt (will auto-generate from content)",
        color: "text-foreground/50 bg-surface-muted border-border",
      };
    }
    if (excerptLength < 80) {
      return {
        label: "Too short for optimal search snippet (<80 chars)",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
      };
    }
    if (excerptLength <= 160) {
      return {
        label: "Optimal SEO snippet length (120–160 chars)",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
      };
    }
    if (excerptLength <= 250) {
      return {
        label: "Getting long – search engines may truncate",
        color: "text-orange-500 bg-orange-500/10 border-orange-500/30",
      };
    }
    return {
      label: "Approaching database limit (max 300 chars)",
      color: "text-rose-500 bg-rose-500/10 border-rose-500/30",
    };
  }, [excerptLength]);

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
          excerpt: excerpt.trim(),
          content: data,
          categories: [...loadedCategoriesRef.current].sort(),
          isPinned,
          isAnonymous,
        })
      );

      shouldSyncInitialEditorContentRef.current = true;
    },
    [mode, excerpt, isPinned, isAnonymous]
  );

  useEffect(() => {
    if (mode !== "edit" || !blogId) return;

    if (!/^[a-f\d]{24}$/i.test(blogId)) {
      router.replace("/admin/blogs");
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
        const normalizedExcerpt = blog.excerpt?.trim() ?? "";
        const normalizedCategoryIds = (blog.categories as BlogCategory[])
          .map((category) => category._id)
          .sort();

        loadedTitleRef.current = normalizedTitle;
        loadedCategoriesRef.current = normalizedCategoryIds;
        shouldSyncInitialEditorContentRef.current = false;

        setTitle(blog.title || "");
        setExcerpt(blog.excerpt || "");
        setContent(blog.content || { blocks: [] });
        setFeaturedImage(blog.featuredImage || null);
        setIsPinned(Boolean(blog.isPinned));
        setIsAnonymous(Boolean(blog.isAnonymous));
        setCategories(
          (blog.categories as BlogCategory[]).map((category) => category._id)
        );
        const normalizedResourceIds = ((blog.linkedResourceIds || []) as Array<{ _id?: string } | string>)
          .map((r) => (typeof r === "object" && r?._id ? r._id : String(r)))
          .sort();

        setLinkedResourceIds(normalizedResourceIds);
        setAuthorData({
          author: blog.author,
          authorName: blog.authorName,
          lastEditedBy: blog.lastEditedBy,
        });

        setLastSavedSnapshot(
          JSON.stringify({
            title: normalizedTitle,
            excerpt: normalizedExcerpt,
            content: blog.content,
            featuredImage: blog.featuredImage ? blog.featuredImage.url : null,
            categories: normalizedCategoryIds,
            linkedResourceIds: normalizedResourceIds,
            isPinned: Boolean(blog.isPinned),
            isAnonymous: Boolean(blog.isAnonymous),
          })
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not load this blog",
          { id: "blog-load-error" }
        );
        router.replace("/admin/blogs");
      } finally {
        setLoadingBlog(false);
      }
    };

    fetchBlog();
  }, [mode, blogId, router]);

  const handleAutoGenerateExcerpt = () => {
    const generated = extractSnippet(content);
    if (!generated) {
      toast.error("Write some content in the editor first to generate an excerpt.");
      return;
    }
    setExcerpt(generated);
    toast.success("Excerpt generated from editor content!");
  };

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
        excerpt: excerpt.trim() || undefined,
        content,
        categories,
        linkedResourceIds,
        featuredImage,
        isPinned: publish ? isPinned : false,
        isAnonymous,
        status: publish ? "published" : "draft",
      };

      if (!publish && isPinned) {
        setIsPinned(false);
      }

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
      {/* Title */}
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

      {/* Custom Excerpt with Live SEO Indicator */}
      <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
              Excerpt & Meta Description
            </p>
            <p className="text-xs text-foreground/50">
              Crucial for search engines, previews, and social media cards.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoGenerateExcerpt}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-surface-muted transition cursor-pointer"
          >
            <span>✨ Auto-generate</span>
          </button>
        </div>

        <textarea
          rows={3}
          maxLength={300}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Write a compelling summary of this post (120–160 characters recommended)..."
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50 resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${seoStatus.color}`}
            >
              {seoStatus.label}
            </span>
          </div>
          <div className="text-foreground/50 space-x-2">
            <span>{wordCount} words</span>
            <span>•</span>
            <span className={excerptLength > 280 ? "text-rose-500 font-semibold" : ""}>
              {excerptLength}/300 chars
            </span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <FeaturedImageUploader
        value={featuredImage}
        onChange={setFeaturedImage}
        title={title}
        disabled={saving}
      />

      {/* EditorJS Article Body */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
            Article Content
          </p>
          <p className="text-xs text-foreground/45">
            Use + or type / to insert headers, images, files, quotes, or embeds.
          </p>
        </div>
        <Editor
          key={blogId || "new-blog"}
          initialData={content}
          onChange={handleEditorChange}
          isAdmin={isAdminRole}
          onResourceMentioned={handleResourceMentioned}
        />
      </div>

      {/* Authorship & Provenance Box in Edit Mode */}
      {mode === "edit" && authorData && (
        <div className="rounded-xl border border-border bg-surface-muted/30 p-4 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-foreground">
              Article Ownership &amp; Attribution
            </span>
            {isTeamPost ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                Mela Team Shared Article
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Individual Author Article
              </span>
            )}
          </div>

          <div className="text-foreground/70 flex flex-wrap items-center gap-x-6 gap-y-1">
            <div>
              <span className="text-foreground/50">Original Creator: </span>
              <strong className="text-foreground">
                {typeof authorData.author === "object" && authorData.author?.name
                  ? `${authorData.author.name} (${authorData.author.email || authorData.author.role?.replace("_", " ") || "Author"})`
                  : authorData.authorName || "Mela Team"}
              </strong>
            </div>
            <div>
              <span className="text-foreground/50">Public Attribution: </span>
              <strong className="text-foreground">
                {isAnonymous ? "Mela Team" : (authorData.authorName || "Mela Team")}
              </strong>
            </div>
          </div>

          {authorData.lastEditedBy && (
            <div className="text-[11px] text-foreground/50 border-t border-border/40 pt-1.5">
              Last modified by:{" "}
              <span className="text-foreground/75 font-medium">
                {typeof authorData.lastEditedBy === "object" && authorData.lastEditedBy?.name
                  ? `${authorData.lastEditedBy.name} (${authorData.lastEditedBy.role?.replace("_", " ") || "Admin"})`
                  : String(authorData.lastEditedBy)}
              </span>
            </div>
          )}

          {!isAuthor && (
            <div className="text-[11px] text-foreground/50 italic border-t border-border/40 pt-1.5 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>
                Original creator credit is locked. Saving changes records you as the last editor without transferring authorship.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Categories & Settings */}
      <div className={`grid grid-cols-1 ${canPin ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
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

        {/* Anonymous Posting Toggle */}
        <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
              Author Display
            </p>
            <p className="text-xs text-foreground/50 mt-1">
              Publish publicly under the &ldquo;Mela Team&rdquo; banner. Team posts are collaborative and can be edited by all administrators.
            </p>
          </div>
          <div className="mt-4">
            <label className={`flex items-center gap-3 select-none ${canChangeAttribution ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}>
              <input
                type="checkbox"
                checked={isAnonymous}
                disabled={!canChangeAttribution}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-border text-foreground focus:ring-1 focus:ring-foreground disabled:opacity-50"
              />
              <span className="text-sm font-medium text-foreground">
                Post anonymously as &ldquo;Mela Team&rdquo;
              </span>
            </label>
            {!canChangeAttribution && (
              <p className="text-[11px] text-foreground/45 mt-1.5 italic">
                Only the original author or Root Administrator can change attribution.
              </p>
            )}
          </div>
        </div>

        {/* Featured / Pinned Toggle (Super Admin & Root Admin only) */}
        {canPin && (
          <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Spotlight & Pin
              </p>
              <p className="text-xs text-foreground/50 mt-1">
                Pin this blog to the top of the blog page and homepage spotlight (maximum 3 pinned blogs).
              </p>
            </div>
            <label className="mt-4 flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-border text-foreground focus:ring-1 focus:ring-foreground"
              />
              <span className="text-sm font-medium text-foreground">
                Pin post to featured (Max 3)
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Linked Resources Section */}
      <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
              Linked Downloadable Resources
            </p>
            <p className="text-xs text-foreground/50 mt-0.5">
              Attach files, slide decks, templates, or cheatsheets. Readers can download them directly from this article.
            </p>
          </div>
        </div>
        <ResourceSelector
          selected={linkedResourceIds}
          onChange={setLinkedResourceIds}
        />
      </div>

      {/* Save Bottom Bar */}
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
              className="btn btn-secondary cursor-pointer"
              disabled={!canSaveDraft || saving}
              onClick={() => handleSave(false)}
            >
              {saveAction === "draft" ? "Saving Draft..." : "Draft & Preview"}
            </button>

            <button
              className="btn btn-primary cursor-pointer"
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
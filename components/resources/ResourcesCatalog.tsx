"use client";

import { useState, useMemo, useEffect } from "react";
import ResourceCard from "./ResourceCard";
import type { ResourceItem } from "@/types/api";

const FORMAT_FILTERS = [
  { id: "all", label: "All Formats" },
  { id: "pdf", label: "PDF Documents" },
  { id: "bundle", label: "Multi-File Decks" },
  { id: "doc", label: "Word Documents" },
  { id: "spreadsheet", label: "Spreadsheets" },
  { id: "archive", label: "Archives (ZIP)" },
];

interface ResourcesCatalogProps {
  initialResources: ResourceItem[];
  initialCategory?: string;
}

export default function ResourcesCatalog({
  initialResources,
  initialCategory = "all",
}: ResourcesCatalogProps) {
  const [query, setQuery] = useState("");

  // Dynamically extract unique categories from resources
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialResources.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return ["all", ...Array.from(set)];
  }, [initialResources]);

  // Normalize initial category match from searchParams
  const matchedInitialCategory = useMemo(() => {
    if (!initialCategory || initialCategory === "all") return "all";
    const clean = initialCategory.toLowerCase().trim();
    const found = categories.find((c) => {
      const lower = c.toLowerCase();
      return (
        lower === clean ||
        lower.replace(/\s+/g, "-") === clean ||
        lower.replace(/s$/, "") === clean.replace(/s$/, "")
      );
    });
    return found || "all";
  }, [categories, initialCategory]);

  const [selectedCategory, setSelectedCategory] = useState(matchedInitialCategory);
  const [selectedFormat, setSelectedFormat] = useState("all");

  // Keep state in sync if initialCategory prop changes
  useEffect(() => {
    if (matchedInitialCategory && matchedInitialCategory !== "all") {
      setSelectedCategory(matchedInitialCategory);
    }
  }, [matchedInitialCategory]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (cat === "all") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", cat);
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleSelectFormat = (fmt: string) => {
    setSelectedFormat(fmt);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (fmt === "all") {
        url.searchParams.delete("format");
      } else {
        url.searchParams.set("format", fmt);
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedFormat("all");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("category");
      url.searchParams.delete("format");
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.pathname);
    }
  };

  // Filter logic
  const filtered = useMemo(() => {
    return initialResources.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Format filter
      if (selectedFormat !== "all") {
        if (selectedFormat === "bundle") {
          if (!item.files || item.files.length <= 1) return false;
        } else if (selectedFormat === "pdf") {
          if (!item.files.some((f) => f.extension === "pdf")) return false;
        } else if (selectedFormat === "doc") {
          if (!item.files.some((f) => ["doc", "docx", "rtf", "odt"].includes(f.extension))) return false;
        } else if (selectedFormat === "archive") {
          if (!item.files.some((f) => ["zip", "rar", "7z", "tar", "gz"].includes(f.extension))) return false;
        } else if (selectedFormat === "spreadsheet") {
          if (!item.files.some((f) => ["xls", "xlsx", "csv"].includes(f.extension))) return false;
        }
      }

      // Search query filter
      if (query.trim()) {
        const lower = query.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(lower);
        const matchesExcerpt = item.excerpt?.toLowerCase().includes(lower);
        const matchesCategory = item.category.toLowerCase().includes(lower);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(lower));
        const matchesFiles = item.files?.some(
          (f) => f.label?.toLowerCase().includes(lower) || f.originalName?.toLowerCase().includes(lower)
        );

        return matchesTitle || matchesExcerpt || matchesCategory || matchesTags || matchesFiles;
      }

      return true;
    });
  }, [initialResources, query, selectedCategory, selectedFormat]);

  return (
    <div className="space-y-8">
      {/* Search and Filters Header */}
      <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/40 p-4 sm:p-6 backdrop-blur-xs shadow-xs">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, file names, or topics..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 pl-11 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-primary focus:outline-hidden"
          />
          <svg
            className="absolute left-3.5 top-3.5 h-4 w-4 text-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-3 text-xs text-foreground/50 hover:text-foreground p-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/40">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-foreground/50 mr-1 hidden sm:inline">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                    : "bg-surface border border-border/70 text-foreground/70 hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {/* Format Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-foreground/50 mr-1 hidden sm:inline">
              Format:
            </span>
            {FORMAT_FILTERS.map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => handleSelectFormat(fmt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedFormat === fmt.id
                    ? "bg-foreground text-background font-semibold"
                    : "bg-surface-muted/60 text-foreground/60 hover:text-foreground hover:bg-surface-muted"
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count & Active Filters Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground/50 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Showing <strong className="text-foreground">{filtered.length}</strong> {filtered.length === 1 ? "resource" : "resources"}
          </span>
          {selectedCategory !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-medium">
              <span>Category: <strong>{selectedCategory}</strong></span>
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className="hover:text-foreground cursor-pointer"
                title="Remove category filter"
              >
                ✕
              </button>
            </span>
          )}
          {selectedFormat !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-foreground/10 text-foreground border border-foreground/20 text-[11px] font-medium">
              <span>Format: <strong>{FORMAT_FILTERS.find((f) => f.id === selectedFormat)?.label || selectedFormat}</strong></span>
              <button
                type="button"
                onClick={() => handleSelectFormat("all")}
                className="hover:text-foreground cursor-pointer"
                title="Remove format filter"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {(query || selectedCategory !== "all" || selectedFormat !== "all") && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Resources Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-foreground/50">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg text-foreground">No resources found</h3>
          <p className="text-sm text-foreground/60 max-w-sm mx-auto">
            {query
              ? `We couldn't find any resources matching "${query}". Try searching for another term or resetting your filters.`
              : "No resources published in this category yet. Check back soon!"}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn btn-secondary text-xs px-4 py-2 mt-2"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

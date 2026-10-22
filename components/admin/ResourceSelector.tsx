"use client";

import { useEffect, useState, useMemo } from "react";
import type { ResourceItem } from "@/types/api";

interface ResourceSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function ResourceSelector({ selected, onChange }: ResourceSelectorProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadResources() {
      try {
        const res = await fetch("/api/resources?limit=100");
        const json = await res.json();
        if (json.success && isMounted) {
          setResources(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load resources for selector", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadResources();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedResources = useMemo(() => {
    return resources.filter((r) => selected.includes(r.id));
  }, [resources, selected]);

  const filteredResources = useMemo(() => {
    if (!query.trim()) return resources;
    const lower = query.toLowerCase();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.category.toLowerCase().includes(lower) ||
        r.files.some((f) => f.label.toLowerCase().includes(lower) || f.originalName.toLowerCase().includes(lower))
    );
  }, [resources, query]);

  const toggleResource = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const removeResource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== id));
  };

  return (
    <div className="space-y-3">
      {/* Selected Items List */}
      {selectedResources.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedResources.map((res) => {
            const firstExt = res.files?.[0]?.extension?.toUpperCase() || "FILE";
            const fileCount = res.files?.length || 0;
            return (
              <div
                key={res.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface-muted/60 text-xs font-medium text-foreground transition-all hover:border-foreground/30 shadow-xs"
              >
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                  {firstExt}
                  {fileCount > 1 ? ` +${fileCount - 1}` : ""}
                </span>
                <span className="truncate max-w-[180px]">{res.title}</span>
                <button
                  type="button"
                  onClick={(e) => removeResource(res.id, e)}
                  className="text-foreground/50 hover:text-foreground p-0.5 rounded cursor-pointer transition-colors"
                  title="Unlink resource"
                  aria-label={`Unlink ${res.title}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-foreground/50 italic">
          No resources attached. Readers won&apos;t see any downloadable decks on this post.
        </p>
      )}

      {/* Attach / Search Button & Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-surface hover:bg-surface-muted text-foreground transition-all cursor-pointer"
        >
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isOpen ? "Close Resource Picker" : "Link Downloadable Resources"}
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-full max-w-md rounded-xl border border-border bg-background p-3 shadow-xl z-30 space-y-2.5 backdrop-blur-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources by title or file..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-foreground/40 focus:outline-hidden focus:border-foreground/40"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-2 text-foreground/40 hover:text-foreground text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-border/20">
              {loading ? (
                <div className="py-4 text-center text-xs text-foreground/50 animate-pulse">
                  Loading available resources...
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="py-4 text-center text-xs text-foreground/50">
                  {query ? "No matching resources found" : "No published resources available yet"}
                </div>
              ) : (
                filteredResources.map((res) => {
                  const isSelected = selected.includes(res.id);
                  const firstExt = res.files?.[0]?.extension?.toUpperCase() || "FILE";
                  const fileCount = res.files?.length || 0;

                  return (
                    <div
                      key={res.id}
                      onClick={() => toggleResource(res.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-surface-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-muted border border-border text-foreground/80">
                          {firstExt}
                          {fileCount > 1 ? ` (${fileCount})` : ""}
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-foreground truncate">{res.title}</p>
                          <p className="text-[11px] text-foreground/50 truncate">
                            {res.category} • {res.downloadCount || 0} downloads
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px]">
                            ✓
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-foreground/60 hover:text-foreground">
                            + Link
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

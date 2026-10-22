import type { API, InlineTool, SanitizerConfig } from "@editorjs/editorjs";
import type { ResourceItem } from "@/types/api";

export interface ResourceMentionConfig {
  onResourceMentioned?: (resource: ResourceItem) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

let cachedResources: ResourceItem[] | null = null;
let isFetchingResources = false;

async function fetchPublishedResources(): Promise<ResourceItem[]> {
  if (cachedResources && cachedResources.length > 0) {
    return cachedResources;
  }
  if (isFetchingResources) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return cachedResources || [];
  }

  isFetchingResources = true;
  try {
    const res = await fetch("/api/resources?limit=100");
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      cachedResources = json.data;
      return json.data;
    }
  } catch (err) {
    console.error("[ResourceMentionTool] Error loading resources:", err);
  } finally {
    isFetchingResources = false;
  }

  return [];
}

export class ResourceMentionTool implements InlineTool {
  private api: API;
  private config: ResourceMentionConfig;
  private button: HTMLButtonElement | null = null;
  private actionsWrapper: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private resultsContainer: HTMLElement | null = null;
  private savedRange: Range | null = null;
  private _state = false;
  private resources: ResourceItem[] = [];

  static get isInline(): boolean {
    return true;
  }

  static get title(): string {
    return "Mention Resource";
  }

  static get sanitize(): SanitizerConfig {
    return {
      a: {
        href: true,
        class: true,
        target: true,
        rel: true,
        "data-resource-id": true,
        "data-resource-slug": true,
        "data-resource-title": true,
        "data-resource-category": true,
        "data-resource-files": true,
        "data-resource-size": true,
        "data-resource-excerpt": true,
      },
    };
  }

  constructor({ api, config }: { api: API; config?: ResourceMentionConfig }) {
    this.api = api;
    this.config = config || {};
  }

  render(): HTMLElement {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "ce-inline-tool ce-inline-tool--resource";
    this.button.title = "Mention Resource (Admins only)";
    this.button.setAttribute("aria-label", "Mention Resource");
    this.button.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
      </svg>
    `;

    return this.button;
  }

  renderActions(): HTMLElement {
    this.actionsWrapper = document.createElement("div");
    this.actionsWrapper.className = "ce-resource-mention-actions p-2.5 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-xl text-left w-72 space-y-2";
    this.actionsWrapper.hidden = true;

    // Header label
    const headerRow = document.createElement("div");
    headerRow.className = "flex items-center justify-between text-[11px] text-foreground/60 font-medium px-1";
    headerRow.innerHTML = `
      <span class="flex items-center gap-1 font-semibold text-foreground">
        <span>📎</span>
        <span>Mention Resource</span>
      </span>
      <span class="text-[10px] text-primary font-mono uppercase">Admin Tool</span>
    `;

    // Search Input
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Search resources to link...";
    this.searchInput.className = "w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface/50 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary";

    // Prevent Editor.js keyboard shortcuts while typing
    this.searchInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        this.api.toolbar.close();
      }
    });

    this.searchInput.addEventListener("input", () => {
      this.filterResults(this.searchInput?.value || "");
    });

    // Results container
    this.resultsContainer = document.createElement("div");
    this.resultsContainer.className = "ce-resource-list max-h-48 overflow-y-auto space-y-1 pr-1 overscroll-contain";

    this.actionsWrapper.appendChild(headerRow);
    this.actionsWrapper.appendChild(this.searchInput);
    this.actionsWrapper.appendChild(this.resultsContainer);

    // Initial load
    void this.loadResourcesList();

    return this.actionsWrapper;
  }

  private async loadResourcesList() {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = `
      <div class="p-3 text-center text-xs text-foreground/50 animate-pulse">
        Loading resources...
      </div>
    `;

    this.resources = await fetchPublishedResources();
    this.renderItems(this.resources);
  }

  private filterResults(query: string) {
    if (!this.resources) return;
    const clean = query.trim().toLowerCase();
    if (!clean) {
      this.renderItems(this.resources);
      return;
    }

    const filtered = this.resources.filter((r) => {
      return (
        r.title.toLowerCase().includes(clean) ||
        r.category.toLowerCase().includes(clean) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(clean))) ||
        (r.files && r.files.some((f) => f.label.toLowerCase().includes(clean)))
      );
    });

    this.renderItems(filtered);
  }

  private renderItems(items: ResourceItem[]) {
    if (!this.resultsContainer) return;
    this.resultsContainer.innerHTML = "";

    // If currently on an existing mention, show "Remove mention" action at top
    if (this._state) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition flex items-center justify-between border border-rose-500/20 mb-1.5";
      removeBtn.innerHTML = `
        <span>Remove Mention Tag</span>
        <span>✕</span>
      `;
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeCurrentMention();
      });
      this.resultsContainer.appendChild(removeBtn);
    }

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "p-3 text-center text-xs text-foreground/50";
      empty.textContent = "No published resources found.";
      this.resultsContainer.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const filesCount = item.files?.length || 0;
      const totalSize = item.files?.reduce((acc, f) => acc + (f.sizeBytes || 0), 0) || 0;
      const primaryExt = item.files?.[0]?.extension?.toUpperCase() || "FILE";
      const formatBadge = filesCount > 1 ? `Deck (${filesCount})` : primaryExt;

      const itemBtn = document.createElement("button");
      itemBtn.type = "button";
      itemBtn.className = "w-full text-left p-2 rounded-lg hover:bg-surface-muted transition flex flex-col gap-0.5 border border-transparent hover:border-border/60 group cursor-pointer";
      itemBtn.innerHTML = `
        <div class="flex items-center justify-between gap-2 w-full">
          <span class="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            ${item.title}
          </span>
          <span class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-surface border border-border/80 text-foreground/75 shrink-0">
            ${formatBadge}
          </span>
        </div>
        <div class="flex items-center gap-2 text-[10px] text-foreground/50">
          <span class="truncate">${item.category}</span>
          <span>•</span>
          <span>${formatBytes(totalSize)}</span>
        </div>
      `;

      itemBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.applyMention(item);
      });

      this.resultsContainer?.appendChild(itemBtn);
    });
  }

  surround(range: Range): void {
    if (!range) return;

    // Check if current selection is already wrapped in a resource-mention
    const existingAnchor = this.api.selection.findParentTag("A", "resource-mention");

    if (existingAnchor) {
      this._state = true;
    } else {
      this._state = false;
      this.savedRange = range.cloneRange();
    }

    // Show actions panel
    if (this.actionsWrapper) {
      this.actionsWrapper.hidden = false;
      this.renderItems(this.resources);
      setTimeout(() => {
        this.searchInput?.focus();
        if (this.searchInput) this.searchInput.value = "";
      }, 50);
    }
  }

  private applyMention(resource: ResourceItem) {
    let range = this.savedRange;

    // If no saved range, try to get from window selection
    if (!range) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      }
    }

    if (!range) return;

    // Restore selection to saved range
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    const selectedText = range.toString().trim();
    const textToInsert = selectedText || resource.title;

    const totalSize = resource.files?.reduce((acc, f) => acc + (f.sizeBytes || 0), 0) || 0;

    const anchor = document.createElement("a");
    anchor.href = `/resources/${resource.slug}`;
    anchor.className = "resource-mention";
    anchor.setAttribute("data-resource-id", resource.id);
    anchor.setAttribute("data-resource-slug", resource.slug);
    anchor.setAttribute("data-resource-title", resource.title);
    anchor.setAttribute("data-resource-category", resource.category);
    anchor.setAttribute("data-resource-files", String(resource.files?.length || 1));
    anchor.setAttribute("data-resource-size", String(totalSize));
    if (resource.excerpt) {
      anchor.setAttribute("data-resource-excerpt", resource.excerpt.slice(0, 120));
    }
    anchor.textContent = textToInsert;

    range.deleteContents();
    range.insertNode(anchor);

    // Put cursor after inserted anchor
    const newRange = document.createRange();
    newRange.setStartAfter(anchor);
    newRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(newRange);

    // Notify blog editor to sync linked resources list
    this.config.onResourceMentioned?.(resource);

    // Close actions
    if (this.actionsWrapper) {
      this.actionsWrapper.hidden = true;
    }
    this.api.toolbar.close();
  }

  private removeCurrentMention() {
    const existingAnchor = this.api.selection.findParentTag("A", "resource-mention");
    if (!existingAnchor) return;

    const parent = existingAnchor.parentNode;
    if (!parent) return;

    while (existingAnchor.firstChild) {
      parent.insertBefore(existingAnchor.firstChild, existingAnchor);
    }
    parent.removeChild(existingAnchor);

    if (this.actionsWrapper) {
      this.actionsWrapper.hidden = true;
    }
    this.api.toolbar.close();
  }

  checkState(): boolean {
    const anchor = this.api.selection.findParentTag("A", "resource-mention");
    this._state = Boolean(anchor);

    if (this.button) {
      this.button.classList.toggle("ce-inline-tool--active", this._state);
    }

    return this._state;
  }
}

import type { API, BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";

export interface ImageData {
  id?: number;
  fileVaultId?: number;
  url?: string;
  caption?: string;
  width?: number; // percentage 25-100
  alignment?: "left" | "center" | "right";
  withBorder?: boolean;
  stretched?: boolean;
  withBackground?: boolean;
  original_name?: string;
  size_bytes?: number;
}

interface ImageToolConfig {
  maxExplorerCount?: number;
}

export class ImageTool implements BlockTool {
  private api: API;
  private readOnly: boolean;
  private config: ImageToolConfig;
  private data: ImageData;
  private container: HTMLElement;
  private xhr: XMLHttpRequest | null = null;
  private cachedFile: File | null = null;

  static get isReadOnlySupported(): boolean {
    return true;
  }

  static get toolbox() {
    return {
      title: "Image",
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
    };
  }

  constructor({ data, api, readOnly, config }: BlockToolConstructorOptions<ImageData, ImageToolConfig>) {
    this.api = api;
    this.readOnly = readOnly ?? false;
    this.config = config ?? {};
    this.data = {
      id: data?.id,
      fileVaultId: data?.fileVaultId ?? data?.id,
      url: data?.url || "",
      caption: data?.caption || "",
      width: typeof data?.width === "number" ? data.width : data?.stretched ? 100 : 100,
      alignment: data?.alignment || "center",
      withBorder: Boolean(data?.withBorder),
      stretched: Boolean(data?.stretched || data?.width === 100),
      withBackground: Boolean(data?.withBackground),
      original_name: data?.original_name || "",
      size_bytes: data?.size_bytes || 0,
    };
    this.container = document.createElement("div");
  }

  render(): HTMLElement {
    this.container.className = "image-tool-wrapper my-4";
    this.renderState();
    return this.container;
  }

  private countImagesInEditor(): number {
    let count = 0;
    const blockCount = this.api.blocks.getBlocksCount();
    for (let i = 0; i < blockCount; i++) {
      const block = this.api.blocks.getBlockByIndex(i);
      if (block?.name === "image") {
        const isUploaded = block.holder?.querySelector("[data-uploaded='true']");
        if (isUploaded) {
          count++;
        }
      }
    }
    return count;
  }

  private renderState(): void {
    this.container.innerHTML = "";

    if (this.data.url) {
      this.renderImage();
      return;
    }

    this.container.removeAttribute("data-uploaded");
    this.renderDropzone();
  }

  private renderDropzone(): void {
    const dropzone = document.createElement("div");
    dropzone.className =
      "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/20 hover:bg-surface-muted/40 p-6 text-center transition cursor-pointer select-none";

    const iconContainer = document.createElement("div");
    iconContainer.className =
      "mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-foreground/70 group-hover:scale-105 transition-transform";
    iconContainer.innerHTML =
      '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';

    const label = document.createElement("p");
    label.className = "text-sm font-medium text-foreground";
    label.textContent = "Upload an image";

    const sublabel = document.createElement("p");
    sublabel.className = "mt-1 text-xs text-foreground/50";
    sublabel.textContent = "Drag & drop or click to browse (PNG, JPG, WEBP, GIF, SVG)";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.className = "hidden";

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file) {
        this.startUpload(file);
      }
    });

    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("border-foreground/60", "bg-surface-muted/60");
    });

    dropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-foreground/60", "bg-surface-muted/60");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("border-foreground/60", "bg-surface-muted/60");
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        this.startUpload(file);
      }
    });

    dropzone.append(iconContainer, label, sublabel, fileInput);
    this.container.appendChild(dropzone);
  }

  private startUpload(file: File): void {
    this.cachedFile = file;

    const currentImageCount = this.countImagesInEditor();

    this.container.innerHTML = "";
    this.container.removeAttribute("data-uploaded");

    const uploadBox = document.createElement("div");
    uploadBox.className = "rounded-xl border border-border bg-surface-muted/30 p-5 space-y-3";

    const header = document.createElement("div");
    header.className = "flex items-center justify-between text-xs";

    const fileInfo = document.createElement("span");
    fileInfo.className = "font-medium text-foreground truncate max-w-[240px]";
    fileInfo.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;

    const percentText = document.createElement("span");
    percentText.className = "font-mono font-semibold text-foreground/70";
    percentText.textContent = "0%";

    header.append(fileInfo, percentText);

    // Progress bar
    const progressTrack = document.createElement("div");
    progressTrack.className = "h-2 w-full overflow-hidden rounded-full bg-surface-muted";
    const progressBar = document.createElement("div");
    progressBar.className =
      "h-full rounded-full bg-emerald-500 transition-all duration-150 ease-out";
    progressBar.style.width = "0%";
    progressTrack.appendChild(progressBar);

    const actions = document.createElement("div");
    actions.className = "flex items-center justify-between pt-1";

    const statusText = document.createElement("span");
    statusText.className = "text-[11px] text-foreground/50";
    statusText.textContent = "Uploading to FileVault...";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className =
      "text-xs text-rose-500 hover:text-rose-600 font-medium transition cursor-pointer";
    cancelBtn.textContent = "Cancel";

    cancelBtn.addEventListener("click", () => {
      if (this.xhr) {
        this.xhr.abort();
        this.xhr = null;
      }
      this.cachedFile = null;
      this.renderDropzone();
    });

    actions.append(statusText, cancelBtn);
    uploadBox.append(header, progressTrack, actions);
    this.container.appendChild(uploadBox);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", "image");
    formData.append("currentCount", String(currentImageCount));

    const xhr = new XMLHttpRequest();
    this.xhr = xhr;

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = `${percent}%`;
        percentText.textContent = `${percent}%`;
        if (percent >= 100) {
          statusText.textContent = "Processing image...";
        }
      }
    });

    xhr.addEventListener("load", () => {
      this.xhr = null;
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          const fileData = response.file;
          this.data = {
            ...this.data,
            id: fileData.id,
            fileVaultId: fileData.id,
            url: fileData.url || fileData.directUrl,
            original_name: fileData.original_name,
            size_bytes: fileData.size_bytes,
          };
          this.cachedFile = null;
          this.renderImage();
        } else {
          const errorMsg =
            response.error || `Upload failed with status code ${xhr.status}`;
          this.renderError(errorMsg);
        }
      } catch {
        this.renderError(`Upload failed with server status ${xhr.status}`);
      }
    });

    xhr.addEventListener("error", () => {
      this.xhr = null;
      this.renderError("Network error: Upload connection interrupted.");
    });

    xhr.addEventListener("abort", () => {
      this.xhr = null;
    });

    xhr.open("POST", "/api/uploads");
    xhr.send(formData);
  }

  private renderError(errorMessage: string): void {
    this.container.innerHTML = "";
    this.container.removeAttribute("data-uploaded");

    const errorBox = document.createElement("div");
    errorBox.className =
      "rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs space-y-2.5 text-rose-600 dark:text-rose-400";

    const header = document.createElement("div");
    header.className = "flex items-start gap-2";
    header.innerHTML = `
      <svg class="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div class="flex-1 font-medium leading-relaxed">${errorMessage}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "flex items-center gap-3 pt-1 border-t border-rose-500/20";

    if (this.cachedFile) {
      const retryBtn = document.createElement("button");
      retryBtn.type = "button";
      retryBtn.className =
        "px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] transition cursor-pointer";
      retryBtn.textContent = "↻ Retry Upload";
      retryBtn.addEventListener("click", () => {
        if (this.cachedFile) {
          this.startUpload(this.cachedFile);
        }
      });
      actions.appendChild(retryBtn);
    }

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className =
      "px-2 py-1 text-foreground/60 hover:text-foreground text-[11px] transition cursor-pointer";
    cancelBtn.textContent = "Dismiss & Choose Different File";
    cancelBtn.addEventListener("click", () => {
      this.cachedFile = null;
      this.renderDropzone();
    });

    actions.appendChild(cancelBtn);
    errorBox.append(header, actions);
    this.container.appendChild(errorBox);
  }

  private renderImage(): void {
    this.container.innerHTML = "";
    this.container.setAttribute("data-uploaded", "true");

    const currentWidth = this.data.width || 100;
    const currentAlignment = this.data.alignment || "center";

    // 1. Controls Toolbar
    const toolbar = document.createElement("div");
    toolbar.className =
      "mb-2.5 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl border border-border bg-surface-muted/30 text-xs";

    // Left controls: Size presets and range slider
    const sizeControls = document.createElement("div");
    sizeControls.className = "flex items-center gap-2";

    const sizeLabel = document.createElement("span");
    sizeLabel.className = "text-[11px] font-medium text-foreground/50 uppercase tracking-wide";
    sizeLabel.textContent = "Width:";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "25";
    slider.max = "100";
    slider.step = "5";
    slider.value = String(currentWidth);
    slider.className = "w-20 sm:w-28 h-1.5 rounded-lg accent-foreground cursor-pointer";

    const widthPercentBadge = document.createElement("span");
    widthPercentBadge.className = "font-mono font-semibold text-[11px] text-foreground/70 min-w-[36px]";
    widthPercentBadge.textContent = `${currentWidth}%`;

    const presetsContainer = document.createElement("div");
    presetsContainer.className = "hidden sm:flex items-center gap-1 border-l border-border pl-2";

    [25, 50, 75, 100].forEach((preset) => {
      const presetBtn = document.createElement("button");
      presetBtn.type = "button";
      presetBtn.className = `px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition cursor-pointer ${
        currentWidth === preset
          ? "bg-foreground text-background font-bold shadow-xs"
          : "bg-surface-muted text-foreground/60 hover:text-foreground hover:bg-surface-muted/80"
      }`;
      presetBtn.textContent = `${preset}%`;
      presetBtn.addEventListener("click", () => {
        this.data.width = preset;
        this.data.stretched = preset === 100;
        slider.value = String(preset);
        widthPercentBadge.textContent = `${preset}%`;
        applyStyles();
      });
      presetsContainer.appendChild(presetBtn);
    });

    sizeControls.append(sizeLabel, slider, widthPercentBadge, presetsContainer);

    // Right controls: Alignment, Border, Replace, Delete
    const actionControls = document.createElement("div");
    actionControls.className = "flex items-center gap-1.5";

    // Alignment buttons
    const alignments: Array<"left" | "center" | "right"> = ["left", "center", "right"];
    const alignIcons: Record<string, string> = {
      left: '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>',
      center: '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
      right: '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>',
    };

    alignments.forEach((align) => {
      const alignBtn = document.createElement("button");
      alignBtn.type = "button";
      alignBtn.title = `Align ${align}`;
      alignBtn.className = `p-1.5 rounded transition cursor-pointer ${
        currentAlignment === align
          ? "bg-foreground text-background"
          : "text-foreground/60 hover:bg-surface-muted hover:text-foreground"
      }`;
      alignBtn.innerHTML = alignIcons[align];
      alignBtn.addEventListener("click", () => {
        this.data.alignment = align;
        applyStyles();
        this.renderImage();
      });
      actionControls.appendChild(alignBtn);
    });

    // Border button
    const borderBtn = document.createElement("button");
    borderBtn.type = "button";
    borderBtn.title = "Toggle Border Frame";
    borderBtn.className = `p-1.5 rounded transition cursor-pointer ${
      this.data.withBorder
        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
        : "text-foreground/60 hover:bg-surface-muted hover:text-foreground"
    }`;
    borderBtn.innerHTML = `
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      </svg>
    `;
    borderBtn.addEventListener("click", () => {
      this.data.withBorder = !this.data.withBorder;
      applyStyles();
      this.renderImage();
    });

    // Replace button
    const replaceBtn = document.createElement("button");
    replaceBtn.type = "button";
    replaceBtn.title = "Replace Image";
    replaceBtn.className =
      "p-1.5 rounded hover:bg-surface-muted text-foreground/60 hover:text-foreground transition cursor-pointer";
    replaceBtn.innerHTML = `
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
    `;
    const replaceInput = document.createElement("input");
    replaceInput.type = "file";
    replaceInput.accept = "image/*";
    replaceInput.className = "hidden";
    replaceInput.addEventListener("change", () => {
      const file = replaceInput.files?.[0];
      if (file) {
        this.startUpload(file);
      }
    });
    replaceBtn.addEventListener("click", () => replaceInput.click());

    // Delete block button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.title = "Remove Image Block";
    deleteBtn.className =
      "p-1.5 rounded hover:bg-rose-500/10 text-rose-500 transition cursor-pointer";
    deleteBtn.innerHTML = `
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;
    deleteBtn.addEventListener("click", () => {
      const index = this.api.blocks.getCurrentBlockIndex();
      if (index >= 0) {
        this.api.blocks.delete(index);
      }
    });

    actionControls.append(borderBtn, replaceBtn, replaceInput, deleteBtn);
    toolbar.append(sizeControls, actionControls);

    // 2. Image Canvas
    const canvas = document.createElement("div");
    canvas.className = "w-full overflow-hidden";

    const imageWrapper = document.createElement("div");
    imageWrapper.className =
      "relative rounded-xl overflow-hidden transition-all duration-150 ease-out";

    const img = document.createElement("img");
    img.src = this.data.url || "";
    img.alt = this.data.caption || this.data.original_name || "Uploaded Image";
    img.className = "w-full h-auto rounded-lg object-contain max-h-[640px] block";
    img.loading = "lazy";

    const applyStyles = () => {
      const w = Math.min(100, Math.max(20, this.data.width || 100));
      imageWrapper.style.width = `${w}%`;

      if (this.data.alignment === "left") {
        imageWrapper.style.marginLeft = "0";
        imageWrapper.style.marginRight = "auto";
      } else if (this.data.alignment === "right") {
        imageWrapper.style.marginLeft = "auto";
        imageWrapper.style.marginRight = "0";
      } else {
        imageWrapper.style.marginLeft = "auto";
        imageWrapper.style.marginRight = "auto";
      }

      if (this.data.withBorder) {
        imageWrapper.className =
          "relative rounded-xl overflow-hidden ring-2 ring-foreground/40 shadow-md p-1 bg-surface-muted/30 transition-all duration-150 ease-out";
      } else {
        imageWrapper.className =
          "relative rounded-xl overflow-hidden ring-0 shadow-none p-0 bg-transparent transition-all duration-150 ease-out";
      }
    };

    applyStyles();

    slider.addEventListener("input", (e) => {
      const val = Number((e.target as HTMLInputElement).value);
      this.data.width = val;
      this.data.stretched = val === 100;
      widthPercentBadge.textContent = `${val}%`;
      applyStyles();
    });

    imageWrapper.appendChild(img);
    canvas.appendChild(imageWrapper);

    // 3. Caption Input
    const captionContainer = document.createElement("div");
    captionContainer.className = "mt-2 px-1";

    const captionInput = document.createElement("input");
    captionInput.type = "text";
    captionInput.placeholder = "Write a caption (also serves as image alt-text for SEO)...";
    captionInput.value = this.data.caption || "";
    captionInput.className =
      "w-full text-center text-xs text-foreground/75 bg-transparent border-0 outline-none focus:ring-1 focus:ring-border rounded py-1 transition";
    captionInput.addEventListener("input", (e) => {
      this.data.caption = (e.target as HTMLInputElement).value;
    });

    captionContainer.appendChild(captionInput);

    this.container.append(toolbar, canvas, captionContainer);
  }

  save(): ImageData {
    return {
      id: this.data.id || this.data.fileVaultId,
      fileVaultId: this.data.fileVaultId || this.data.id,
      url: this.data.url,
      caption: this.data.caption,
      width: this.data.width || 100,
      alignment: this.data.alignment || "center",
      withBorder: this.data.withBorder,
      stretched: this.data.stretched || this.data.width === 100,
      withBackground: this.data.withBackground,
      original_name: this.data.original_name,
      size_bytes: this.data.size_bytes,
    };
  }

  validate(savedData: ImageData): boolean {
    return Boolean(savedData.url && savedData.url.trim().length > 0);
  }
}

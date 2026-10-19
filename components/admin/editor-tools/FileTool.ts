import type { API, BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";

export interface FileData {
  id?: number;
  fileVaultId?: number;
  url?: string;
  downloadUrl?: string;
  original_name?: string;
  title?: string;
  mime_type?: string;
  size_bytes?: number;
  extension?: string;
  isPrivate?: boolean;
}

interface FileToolConfig {
  maxExplorerCount?: number;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFileIcon(extension = "", mime = ""): string {
  const ext = extension.toLowerCase().replace(/^\./, "");
  if (ext === "pdf" || mime.includes("pdf")) {
    return `<svg class="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`;
  }
  if (["doc", "docx", "odt", "rtf", "txt"].includes(ext) || mime.includes("word")) {
    return `<svg class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
  }
  if (["xls", "xlsx", "csv", "ods"].includes(ext) || mime.includes("excel") || mime.includes("spreadsheet")) {
    return `<svg class="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
  }
  if (["ppt", "pptx", "odp"].includes(ext) || mime.includes("presentation")) {
    return `<svg class="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>`;
  }
  if (["zip", "tar", "gz", "7z", "rar"].includes(ext) || mime.includes("zip") || mime.includes("compressed")) {
    return `<svg class="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>`;
  }
  if (["mp3", "wav", "ogg", "m4a"].includes(ext) || mime.includes("audio")) {
    return `<svg class="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>`;
  }
  if (["mp4", "webm", "mov"].includes(ext) || mime.includes("video")) {
    return `<svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`;
  }
  return `<svg class="h-6 w-6 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>`;
}

export class FileTool implements BlockTool {
  private api: API;
  private readOnly: boolean;
  private config: FileToolConfig;
  private data: FileData;
  private container: HTMLElement;
  private xhr: XMLHttpRequest | null = null;
  private cachedFile: File | null = null;

  static get isReadOnlySupported(): boolean {
    return true;
  }

  static get toolbox() {
    return {
      title: "File / Attachment",
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>',
    };
  }

  constructor({ data, api, readOnly, config }: BlockToolConstructorOptions<FileData, FileToolConfig>) {
    this.api = api;
    this.readOnly = readOnly ?? false;
    this.config = config ?? {};
    this.data = {
      id: data?.id,
      fileVaultId: data?.fileVaultId ?? data?.id,
      url: data?.url || data?.downloadUrl || "",
      downloadUrl: data?.downloadUrl || (data?.id ? `/api/uploads/download/${data.id}` : ""),
      original_name: data?.original_name || data?.title || "",
      title: data?.title || data?.original_name || "",
      mime_type: data?.mime_type || "",
      size_bytes: data?.size_bytes || 0,
      extension: data?.extension || (data?.original_name ? data.original_name.split(".").pop() : ""),
      isPrivate: data?.isPrivate !== false,
    };
    this.container = document.createElement("div");
  }

  render(): HTMLElement {
    this.container.className = "file-tool-wrapper my-3";
    this.renderState();
    return this.container;
  }

  private countFilesInEditor(): number {
    let count = 0;
    const blockCount = this.api.blocks.getBlocksCount();
    for (let i = 0; i < blockCount; i++) {
      const block = this.api.blocks.getBlockByIndex(i);
      if (block?.name === "file" || block?.name === "attaches") {
        const isUploaded = block.holder?.querySelector('[data-uploaded="true"]');
        if (isUploaded) {
          count++;
        }
      }
    }
    return count;
  }

  private renderState(): void {
    this.container.innerHTML = "";

    if (this.data.id || this.data.fileVaultId) {
      this.renderFileCard();
      return;
    }

    this.container.removeAttribute("data-uploaded");
    this.renderDropzone();
  }

  private renderDropzone(): void {
    const dropzone = document.createElement("div");
    dropzone.className =
      "group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-muted/20 hover:bg-surface-muted/40 p-6 text-center transition cursor-pointer select-none";

    const deleteBlockBtn = document.createElement("button");
    deleteBlockBtn.type = "button";
    deleteBlockBtn.title = "Dismiss empty file block";
    deleteBlockBtn.className =
      "absolute top-2.5 right-2.5 p-1 rounded-md text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer";
    deleteBlockBtn.innerHTML = `
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    `;
    deleteBlockBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = this.api.blocks.getCurrentBlockIndex();
      if (index >= 0) {
        this.api.blocks.delete(index);
      }
    });
    dropzone.appendChild(deleteBlockBtn);

    const iconContainer = document.createElement("div");
    iconContainer.className =
      "mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-surface-muted text-foreground/70 group-hover:scale-105 transition-transform";
    iconContainer.innerHTML =
      '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>';

    const label = document.createElement("p");
    label.className = "text-sm font-medium text-foreground";
    label.textContent = "Upload a document or file";

    const sublabel = document.createElement("p");
    sublabel.className = "mt-1 text-xs text-foreground/50";
    sublabel.textContent = "PDF, DOCX, XLSX, PPTX, ZIP, Archives, Media (Private in drafts)";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
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
      if (file) {
        this.startUpload(file);
      }
    });

    dropzone.append(iconContainer, label, sublabel, fileInput);
    this.container.appendChild(dropzone);
  }

  private startUpload(file: File): void {
    this.cachedFile = file;

    const currentFileCount = this.countFilesInEditor();

    this.container.innerHTML = "";
    const uploadBox = document.createElement("div");
    uploadBox.className = "rounded-xl border border-border bg-surface-muted/30 p-5 space-y-3";

    const header = document.createElement("div");
    header.className = "flex items-center justify-between text-xs";

    const fileInfo = document.createElement("span");
    fileInfo.className = "font-medium text-foreground truncate max-w-[260px]";
    fileInfo.textContent = `${file.name} (${formatBytes(file.size)})`;

    const percentText = document.createElement("span");
    percentText.className = "font-mono font-semibold text-foreground/70";
    percentText.textContent = "0%";

    header.append(fileInfo, percentText);

    const progressTrack = document.createElement("div");
    progressTrack.className = "h-2 w-full overflow-hidden rounded-full bg-surface-muted";
    const progressBar = document.createElement("div");
    progressBar.className =
      "h-full rounded-full bg-blue-500 transition-all duration-150 ease-out";
    progressBar.style.width = "0%";
    progressTrack.appendChild(progressBar);

    const actions = document.createElement("div");
    actions.className = "flex items-center justify-between pt-1";

    const statusText = document.createElement("span");
    statusText.className = "text-[11px] text-foreground/50";
    statusText.textContent = "Streaming to FileVault backend...";

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
    formData.append("assetType", "file");
    formData.append("currentCount", String(currentFileCount));

    const xhr = new XMLHttpRequest();
    this.xhr = xhr;

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = `${percent}%`;
        percentText.textContent = `${percent}%`;
        if (percent >= 100) {
          statusText.textContent = "Validating file binary & registering...";
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
            id: fileData.id,
            fileVaultId: fileData.id,
            url: fileData.downloadUrl || `/api/uploads/download/${fileData.id}`,
            downloadUrl: fileData.downloadUrl || `/api/uploads/download/${fileData.id}`,
            original_name: fileData.original_name,
            title: fileData.original_name,
            mime_type: fileData.mime_type,
            size_bytes: fileData.size_bytes,
            extension: fileData.extension,
            isPrivate: true,
          };
          this.cachedFile = null;
          this.renderFileCard();
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

  private renderFileCard(): void {
    this.container.innerHTML = "";
    this.container.setAttribute("data-uploaded", "true");

    const card = document.createElement("div");
    card.className =
      "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 shadow-sm hover:border-foreground/40 transition group";

    // Left info
    const left = document.createElement("div");
    left.className = "flex items-center gap-3 min-w-0 flex-1";

    const iconWrapper = document.createElement("div");
    iconWrapper.className =
      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted";
    iconWrapper.innerHTML = getFileIcon(this.data.extension, this.data.mime_type);

    const textInfo = document.createElement("div");
    textInfo.className = "min-w-0 flex-1";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = this.data.title || this.data.original_name || "Attachment";
    titleInput.placeholder = "Attachment title...";
    titleInput.className =
      "w-full font-medium text-sm text-foreground bg-transparent border-0 outline-none p-0 focus:ring-1 focus:ring-border rounded";
    titleInput.addEventListener("input", (e) => {
      this.data.title = (e.target as HTMLInputElement).value;
    });

    const metaLine = document.createElement("div");
    metaLine.className = "flex flex-wrap items-center gap-2 mt-1 text-xs text-foreground/50";

    const sizeSpan = document.createElement("span");
    sizeSpan.textContent = formatBytes(this.data.size_bytes);

    const dot = document.createElement("span");
    dot.textContent = "•";

    const privacyBadge = document.createElement("span");
    privacyBadge.className =
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20";
    privacyBadge.innerHTML = `
      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
      Admin-only in draft
    `;

    metaLine.append(sizeSpan, dot, privacyBadge);
    textInfo.append(titleInput, metaLine);
    left.append(iconWrapper, textInfo);

    // Right actions
    const right = document.createElement("div");
    right.className = "flex items-center gap-2 shrink-0";

    const downloadLink = document.createElement("a");
    downloadLink.href = this.data.downloadUrl || `/api/uploads/download/${this.data.fileVaultId || this.data.id}`;
    downloadLink.target = "_blank";
    downloadLink.rel = "noopener noreferrer";
    downloadLink.className =
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-surface-muted text-xs font-medium text-foreground transition cursor-pointer";
    downloadLink.innerHTML = `
      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      Test Download
    `;

    const replaceBtn = document.createElement("button");
    replaceBtn.type = "button";
    replaceBtn.title = "Replace file";
    replaceBtn.className =
      "p-1.5 rounded-lg border border-border hover:bg-surface-muted text-foreground/60 hover:text-foreground text-xs transition cursor-pointer";
    replaceBtn.innerHTML = `
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
    `;
    const replaceInput = document.createElement("input");
    replaceInput.type = "file";
    replaceInput.className = "hidden";
    replaceInput.addEventListener("change", () => {
      const file = replaceInput.files?.[0];
      if (file) {
        this.startUpload(file);
      }
    });
    replaceBtn.addEventListener("click", () => replaceInput.click());

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.title = "Remove file attachment";
    deleteBtn.className =
      "p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-rose-500 transition cursor-pointer";
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

    right.append(downloadLink, replaceBtn, replaceInput, deleteBtn);
    card.append(left, right);
    this.container.appendChild(card);
  }

  save(): FileData {
    return {
      id: this.data.id || this.data.fileVaultId,
      fileVaultId: this.data.fileVaultId || this.data.id,
      url: this.data.url || this.data.downloadUrl,
      downloadUrl: this.data.downloadUrl,
      original_name: this.data.original_name,
      title: this.data.title || this.data.original_name,
      mime_type: this.data.mime_type,
      size_bytes: this.data.size_bytes,
      extension: this.data.extension,
      isPrivate: this.data.isPrivate !== false,
    };
  }

  validate(savedData: FileData): boolean {
    return Boolean((savedData.id || savedData.fileVaultId) && (savedData.url || savedData.downloadUrl));
  }
}

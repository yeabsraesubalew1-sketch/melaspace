import { UserRole } from "@/models/User";
import {
  Agent,
  fetch as undiciFetch,
  FormData as UndiciFormData,
  RequestInit as UndiciRequestInit,
  Response as UndiciResponse,
} from "undici";

export const FILEVAULT_URL = (process.env.FILEVAULT_URL || "http://localhost:8000").replace(/\/+$/, "");
const FILEVAULT_ADMIN_KEY = process.env.FILEVAULT_API_KEY || "";
const FILEVAULT_PUBLIC_KEY = process.env.FILEVAULT_API_KEY_PUBLIC || "";

export const ADMIN_ROLES: UserRole[] = ["root_admin", "super_admin", "manager", "author"];

/**
 * Returns the appropriate FileVault API key based on user role.
 * Admins use the unlimited admin key; explorers (users) use the public key.
 */
export function getFileVaultApiKeyForRole(role?: string | null): string {
  if (role && ADMIN_ROLES.includes(role as UserRole)) {
    return FILEVAULT_ADMIN_KEY || FILEVAULT_PUBLIC_KEY;
  }
  return FILEVAULT_PUBLIC_KEY || FILEVAULT_ADMIN_KEY;
}

export interface FileVaultFileRecord {
  id: number;
  project_id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  url: string;
  created_at: string;
}

export interface FileVaultUploadResponse {
  file: FileVaultFileRecord;
}

export interface FileVaultErrorResponse {
  error?: {
    code?: string;
    message?: string;
    context?: Record<string, unknown>;
  };
}

/**
 * Custom Undici Agent for FileVault with resilient timeouts and keep-alive socket reuse.
 * - connect timeout: 60s (prevents UND_ERR_CONNECT_TIMEOUT on Bluehost SSL handshakes)
 * - headers / body timeout: 10 minutes (handles large uploads up to 1GB)
 * - keepAlive: reuses TCP & TLS connections for fast subsequent requests
 */
const fileVaultAgent = new Agent({
  connect: {
    timeout: 60_000,
  },
  headersTimeout: 600_000,
  bodyTimeout: 600_000,
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 300_000,
});

/**
 * Bluehost shared hosting Anti-Bot protection cookie cache.
 * Bluehost serves a JS challenge if the cookie is missing, causing connection stalls or 409 responses.
 */
let cachedCookie = process.env.FILEVAULT_COOKIE || "humans_21909=1";

function extractChallengeCookie(html: string): string | null {
  if (!html.includes("document.cookie")) return null;
  const marker = 'document.cookie = "';
  const start = html.indexOf(marker);
  if (start !== -1) {
    const valueStart = start + marker.length;
    const end = html.indexOf('"', valueStart);
    if (end !== -1) {
      return html.substring(valueStart, end);
    }
  }
  return null;
}

/**
 * Resilient fetch wrapper with custom Agent, browser User-Agent, Bluehost cookie injection,
 * and automatic retry on connection timeouts and challenge responses.
 */
export async function fileVaultFetch(
  url: string,
  options: UndiciRequestInit = {},
  retries = 2
): Promise<UndiciResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        ...(cachedCookie ? { Cookie: cachedCookie } : {}),
        ...((options.headers as Record<string, string>) || {}),
      };

      const res = await undiciFetch(url, {
        ...options,
        headers,
        dispatcher: fileVaultAgent,
      });

      // If Bluehost serves the anti-bot script (status 409 or HTML with document.cookie),
      // parse the challenge cookie and replay the request.
      if (res.status === 409 && attempt < retries) {
        const text = await res.text();
        const extracted = extractChallengeCookie(text);
        if (extracted) {
          console.log(`[FILEVAULT] Extracted Bluehost challenge cookie: ${extracted}`);
          cachedCookie = extracted;
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
      }

      return res;
    } catch (err: unknown) {
      lastError = err;
      const errorCode =
        (err as { code?: string })?.code ||
        (err as { cause?: { code?: string } })?.cause?.code;

      const isNetworkRetryable =
        errorCode === "UND_ERR_CONNECT_TIMEOUT" ||
        errorCode === "UND_ERR_SOCKET" ||
        errorCode === "ECONNRESET" ||
        errorCode === "ETIMEDOUT";

      if (attempt < retries && isNetworkRetryable) {
        console.warn(
          `[FILEVAULT] Request to ${url} failed with ${errorCode} (attempt ${attempt + 1}/${retries + 1}). Retrying in 1.5s...`
        );
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Uploads a file buffer or stream to FileVault.
 */
export async function uploadToFileVault(
  fileBlob: Blob,
  fileName: string,
  apiKey: string
): Promise<FileVaultFileRecord> {
  if (!apiKey) {
    throw new Error("FileVault API key is not configured.");
  }

  const formData = new UndiciFormData();
  formData.append("file", fileBlob as unknown as Blob, fileName);

  const res = await fileVaultFetch(`${FILEVAULT_URL}/api/v1/files`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: formData,
  });

  const text = await res.text();
  let data: FileVaultUploadResponse | FileVaultErrorResponse | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    // Response was not JSON
  }

  if (!res.ok || !data || !("file" in data)) {
    const errorMsg =
      (data as FileVaultErrorResponse)?.error?.message ||
      `FileVault upload failed with status ${res.status}`;
    const errorCode = (data as FileVaultErrorResponse)?.error?.code || "UPLOAD_FAILED";

    const err = new Error(errorMsg);
    (err as Error & { code?: string; status?: number }).code = errorCode;
    (err as Error & { code?: string; status?: number }).status = res.status;
    throw err;
  }

  return data.file;
}

/**
 * Soft deletes (moves to trash) a file in FileVault.
 */
export async function trashFileVaultFile(fileId: number, apiKey: string): Promise<boolean> {
  if (!apiKey || !fileId) return false;

  try {
    const res = await fileVaultFetch(`${FILEVAULT_URL}/api/v1/files/${fileId}`, {
      method: "DELETE",
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    return res.ok;
  } catch (error) {
    console.error(`[FILEVAULT] Error trashing file ${fileId}:`, error);
    return false;
  }
}

/**
 * Permanently purges a file in FileVault.
 */
export async function purgeFileVaultFile(fileId: number, apiKey: string): Promise<boolean> {
  if (!apiKey || !fileId) return false;

  try {
    const res = await fileVaultFetch(`${FILEVAULT_URL}/api/v1/files/${fileId}/purge`, {
      method: "DELETE",
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    return res.ok;
  } catch (error) {
    console.error(`[FILEVAULT] Error purging file ${fileId}:`, error);
    return false;
  }
}

/**
 * Restores a trashed file in FileVault.
 */
export async function restoreFileVaultFile(fileId: number, apiKey: string): Promise<boolean> {
  if (!apiKey || !fileId) return false;

  try {
    const res = await fileVaultFetch(`${FILEVAULT_URL}/api/v1/files/${fileId}/restore`, {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    return res.ok;
  } catch (error) {
    console.error(`[FILEVAULT] Error restoring file ${fileId}:`, error);
    return false;
  }
}

/**
 * Fetches the authenticated download stream for private or trashed files.
 */
export async function downloadFileVaultStream(
  fileId: number,
  apiKey: string
): Promise<UndiciResponse> {
  if (!apiKey) {
    throw new Error("FileVault API key is required for authenticated download.");
  }

  const res = await fileVaultFetch(`${FILEVAULT_URL}/api/v1/files/${fileId}/download`, {
    method: "GET",
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let errJson: FileVaultErrorResponse | null = null;
    try {
      errJson = JSON.parse(text);
    } catch {
      // not JSON
    }
    const msg = errJson?.error?.message || `Download failed with HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res;
}

/**
 * Fetches file metadata by ID from FileVault.
 */
export async function getFileVaultMetadata(
  fileId: number,
  apiKey: string
): Promise<FileVaultFileRecord | null> {
  if (!apiKey || !fileId) return null;

  try {
    const res = await fileVaultFetch(`${FILEVAULT_URL}/api/v1/files/${fileId}`, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    if (!res.ok) return null;
    const text = await res.text();
    const data = JSON.parse(text) as { file?: FileVaultFileRecord };
    return data?.file || null;
  } catch (err) {
    console.error(`[FILEVAULT] Error fetching metadata for file ${fileId}:`, err);
    return null;
  }
}

/**
 * Warms up the SSL/TLS handshake and keeps an active keep-alive socket
 * in the FileVault connection pool. This eliminates the 1.4s SSL handshake
 * latency when visitors browse listing pages and view articles.
 */
let isWarming = false;
let lastWarmedAt = 0;

export function warmFileVaultConnection(): void {
  const now = Date.now();
  // KeepAlive pool retains sockets for 60s, so warm at most once every 45s
  if (isWarming || now - lastWarmedAt < 45_000) {
    return;
  }

  isWarming = true;

  // Fire-and-forget HEAD request to establish TLS tunnel and pool the socket
  fileVaultFetch(`${FILEVAULT_URL}/api/v1/files`, {
    method: "HEAD",
    headers: {
      "X-Api-Key": getFileVaultApiKeyForRole("explorer"),
    },
  })
    .then(() => {
      lastWarmedAt = Date.now();
    })
    .catch(() => {
      // Fallback ping if HEAD not supported
      return fileVaultFetch(`${FILEVAULT_URL}/health`, { method: "GET" })
        .then(() => {
          lastWarmedAt = Date.now();
        })
        .catch(() => {
          // TLS handshake still succeeded at the network layer
          lastWarmedAt = Date.now();
        });
    })
    .finally(() => {
      isWarming = false;
    });
}

import { UserRole } from "@/models/User";

const FILEVAULT_URL = (process.env.FILEVAULT_URL || "http://localhost:8000").replace(/\/+$/, "");
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

  const formData = new FormData();
  formData.append("file", fileBlob, fileName);

  const res = await fetch(`${FILEVAULT_URL}/api/v1/files`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: formData,
  });

  const data = (await res.json().catch(() => null)) as
    | FileVaultUploadResponse
    | FileVaultErrorResponse
    | null;

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
    const res = await fetch(`${FILEVAULT_URL}/api/v1/files/${fileId}`, {
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
    const res = await fetch(`${FILEVAULT_URL}/api/v1/files/${fileId}/purge`, {
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
 * Fetches the authenticated download stream for private or trashed files.
 */
export async function downloadFileVaultStream(
  fileId: number,
  apiKey: string
): Promise<Response> {
  if (!apiKey) {
    throw new Error("FileVault API key is required for authenticated download.");
  }

  const res = await fetch(`${FILEVAULT_URL}/api/v1/files/${fileId}/download`, {
    method: "GET",
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  if (!res.ok) {
    const errJson = (await res.json().catch(() => null)) as FileVaultErrorResponse | null;
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
    const res = await fetch(`${FILEVAULT_URL}/api/v1/files/${fileId}`, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.file || null;
  } catch (err) {
    console.error(`[FILEVAULT] Error fetching metadata for file ${fileId}:`, err);
    return null;
  }
}

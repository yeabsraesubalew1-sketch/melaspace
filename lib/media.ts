/**
 * Normalizes an asset or image URL.
 * If the URL points directly to FileVault on Bluehost (which has cold handshake stalls / bot protection),
 * it routes it through the local MelaSpace caching proxy (/api/files/...) to ensure 100% reliable loading.
 */
export function normalizeMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("/api/")) return url;

  // Check if it's a FileVault /files/ path
  const fileVaultUrl = process.env.NEXT_PUBLIC_FILEVAULT_URL || process.env.FILEVAULT_URL || "";
  const isBluehost = url.includes(".mybluehost.me/files/");
  const isLocalhost = url.includes("localhost:8000/files/");
  const isConfiguredVault = Boolean(fileVaultUrl && url.startsWith(fileVaultUrl) && url.includes("/files/"));

  if (isBluehost || isLocalhost || isConfiguredVault) {
    const match = url.match(/\/files\/(.+)$/);
    if (match) {
      return `/api/files/${match[1]}`;
    }
  }

  return url;
}

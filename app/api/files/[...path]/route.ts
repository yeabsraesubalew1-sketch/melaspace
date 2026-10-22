import { NextResponse } from "next/server";
import { FILEVAULT_URL, fileVaultFetch } from "@/lib/filevault";

interface Params {
  path: string[];
}

export const maxDuration = 60;

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  ico: "image/x-icon",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { path } = await params;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: "File path missing" }, { status: 400 });
    }

    // Safely reconstruct the FileVault relative path
    const subPath = path.map((segment) => encodeURIComponent(segment)).join("/");
    const targetUrl = `${FILEVAULT_URL}/files/${subPath}`;

    const res = await fileVaultFetch(targetUrl, {
      method: "GET",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `FileVault responded with ${res.status}` },
        { status: res.status }
      );
    }

    const extension = path[path.length - 1]?.split(".").pop()?.toLowerCase() || "";
    const detectedType = MIME_TYPES[extension];
    const rawContentType = res.headers.get("content-type");
    // Ensure Bluehost anti-bot HTML responses are not misclassified as image content
    const contentType =
      rawContentType && !rawContentType.includes("text/html")
        ? rawContentType
        : detectedType || "image/jpeg";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", "inline");
    // Aggressive immutable cache for public media files
    headers.set(
      "Cache-Control",
      "public, max-age=31536000, stale-while-revalidate=86400, immutable"
    );

    const contentLength = res.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    const etag = res.headers.get("etag");
    if (etag) {
      headers.set("ETag", etag);
    }

    return new Response(res.body as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("[FILE_PROXY] Error proxying file:", error);
    const msg = error instanceof Error ? error.message : "Proxy failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

import type { ImageBlock as ImageBlockType } from "../types";
import { normalizeMediaUrl } from "@/lib/media";

interface Props {
  block: ImageBlockType;
  blogTitle?: string;
}

export default function ImageBlock({ block, blogTitle }: Props) {
  const {
    url,
    caption,
    width = 100,
    alignment = "center",
    withBorder,
    stretched,
    withBackground,
    original_name,
  } = block.data;

  if (!url) return null;

  const normalizedUrl = normalizeMediaUrl(url);

  // Alt text priority: Caption -> Blog Title -> Original Filename -> Fallback
  const cleanCaption = caption ? caption.replace(/<[^>]+>/g, "").trim() : "";
  const altText = cleanCaption || blogTitle?.trim() || original_name || "Article media";

  // Effective width percentage
  const effectiveWidth = stretched ? 100 : Math.min(100, Math.max(20, width || 100));

  // Alignment classes
  const alignClass =
    alignment === "left"
      ? "mr-auto ml-0"
      : alignment === "right"
        ? "ml-auto mr-0"
        : "mx-auto";

  return (
    <figure
      style={{ width: `${effectiveWidth}%` }}
      className={`my-8 overflow-hidden rounded-xl transition-all duration-200 ${alignClass} ${
        withBorder ? "ring-1 ring-border/80 shadow-md p-1" : ""
      } ${withBackground ? "bg-surface-muted/40 p-4 sm:p-6" : ""}`}
    >
      <div className="relative overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={normalizedUrl}
          alt={altText}
          loading="lazy"
          className="w-full h-auto object-contain max-h-[640px] mx-auto rounded-lg"
        />
      </div>

      {caption && (
        <figcaption
          className="mt-2.5 text-center text-xs text-foreground/60 italic px-4"
          dangerouslySetInnerHTML={{ __html: caption }}
        />
      )}
    </figure>
  );
}

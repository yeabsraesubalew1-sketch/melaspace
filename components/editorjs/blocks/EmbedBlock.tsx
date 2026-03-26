import type { EmbedBlock as EmbedBlockType } from "../types";

interface Props {
  block: EmbedBlockType;
}

function sanitizeNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function getInstagramEmbedUrl(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  const postType = parts[0];
  const shortcode = parts[1];

  if (!shortcode) return null;

  if (postType === "p" || postType === "reel" || postType === "tv") {
    return `https://www.instagram.com/${postType}/${shortcode}/embed`;
  }

  return null;
}

function getPinterestEmbedUrl(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  const pinIndex = parts.findIndex((part) => part === "pin");
  const pinId = pinIndex >= 0 ? parts[pinIndex + 1] : null;

  if (!pinId) return null;

  return `https://assets.pinterest.com/ext/embed.html?id=${pinId}`;
}

function getEmbedUrl(block: EmbedBlockType) {
  if (block.data.embed) {
    return block.data.embed;
  }

  if (!block.data.source) {
    return null;
  }

  try {
    const url = new URL(block.data.source);

    if (block.data.service === "instagram") {
      return getInstagramEmbedUrl(url) ?? block.data.source;
    }

    if (block.data.service === "pinterest") {
      return getPinterestEmbedUrl(url) ?? block.data.source;
    }

    if (block.data.service === "youtube") {
      const videoId = url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop();

      return videoId ? `https://www.youtube.com/embed/${videoId}` : block.data.source;
    }

    return block.data.source;
  } catch {
    return block.data.source;
  }
}

function getAspectRatio(block: EmbedBlockType) {
  const sourceWidth = sanitizeNumber(block.data.width);
  const sourceHeight = sanitizeNumber(block.data.height);

  if (sourceWidth && sourceHeight) {
    const ratio = sourceHeight / sourceWidth;
    return Math.min(2.2, Math.max(0.5, ratio));
  }

  switch (block.data.service) {
    case "youtube":
    case "facebook":
    case "coub":
      return 9 / 16;
    case "instagram":
      return 1.2;
    case "pinterest":
      return 1.5;
    default:
      return 9 / 16;
  }
}

export default function EmbedBlock({ block }: Props) {
  const { caption } = block.data;
  const embedUrl = getEmbedUrl(block);
  const service = block.data.service?.toLowerCase() ?? "";
  const isPinterest = service === "pinterest";
  const aspectRatio = getAspectRatio(block);
  const tunedHeight = sanitizeNumber(block.tunes?.embedSize?.height);
  const sourceHeight = sanitizeNumber(block.data.height);
  const pinterestHeight = tunedHeight
    ? `${Math.max(360, tunedHeight)}px`
    : sourceHeight
      ? `clamp(320px, 95vw, ${Math.max(520, sourceHeight)}px)`
      : "clamp(320px, 95vw, 680px)";

  if (!embedUrl) return null;

  return (
    <figure className="my-10 flex flex-col items-center">
      <div
        className="rounded-2xl w-full max-w-full overflow-hidden"
        style={{
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {isPinterest ? (
          <iframe
            src={embedUrl}
            title={caption || block.data.service || "Embedded content"}
            className="w-full border-0"
            style={{
              height: pinterestHeight,
            }}
            scrolling="no"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div
            className="relative w-full"
            style={{
              paddingTop: `${aspectRatio * 100}%`,
            }}
          >
            <iframe
              src={embedUrl}
              title={caption || block.data.service || "Embedded content"}
              className="absolute inset-0 h-full w-full border-0"
              scrolling="no"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {caption && (
        <figcaption
          className="text-sm opacity-70 mt-1 text-center leading-snug"
          dangerouslySetInnerHTML={{ __html: caption }}
        />
      )}
    </figure>
  );
}
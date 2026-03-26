import type { EditorContent } from "@/types/editor";
import type { ListItem, RenderableBlock } from "./types";

function normalizeListItems(items: unknown[]): ListItem[] {
  return items.flatMap<ListItem>((item): ListItem[] => {
    if (typeof item === "string") {
      return [{ content: item, items: [] }];
    }

    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as {
      content?: unknown;
      meta?: { checked?: unknown };
      items?: unknown;
    };

    if (typeof candidate.content !== "string") {
      return [];
    }

    return [
      {
        content: candidate.content,
        meta:
          candidate.meta && typeof candidate.meta === "object"
            ? { checked: candidate.meta.checked === true }
            : undefined,
        items: Array.isArray(candidate.items)
          ? normalizeListItems(candidate.items)
          : [],
      },
    ];
  });
}

/**
 * Converts raw EditorJS content into a safe block list
 * the renderer can work with.
 */
export function normalizeEditorContent(
  content: EditorContent | null | undefined
): RenderableBlock[] {
  if (!content || !Array.isArray(content.blocks)) {
    return [];
  }

  const normalized: RenderableBlock[] = [];

  for (const block of content.blocks) {
    if (!block || typeof block.type !== "string") {
      continue;
    }

    const data = block.data as Record<string, unknown> | undefined;

    switch (block.type) {
      case "paragraph":
        if (typeof data?.text === "string" && data.text.trim()) {
          normalized.push({
            type: "paragraph",
            data: { text: data.text },
          });
        }
        break;

      case "header":
        if (
          typeof data?.text === "string" &&
          typeof data?.level === "number" &&
          data.level >= 1 &&
          data.level <= 6
        ) {
          normalized.push({
            type: "header",
            data: {
              text: data.text,
              level: data.level as 1 | 2 | 3 | 4 | 5 | 6,
            },
          });
        }
        break;

      case "list":
        if (Array.isArray(data?.items) && data.items.length > 0) {
          normalized.push({
            type: "list",
            data: {
              style:
                data.style === "ordered" ||
                data.style === "checklist"
                  ? data.style
                  : "unordered",
              meta:
                data.meta && typeof data.meta === "object"
                  ? {
                      counterType:
                        (data.meta as { counterType?: RenderableBlock extends never ? never : string }).counterType === "lower-roman" ||
                        (data.meta as { counterType?: string }).counterType === "upper-roman" ||
                        (data.meta as { counterType?: string }).counterType === "lower-alpha" ||
                        (data.meta as { counterType?: string }).counterType === "upper-alpha" ||
                        (data.meta as { counterType?: string }).counterType === "numeric"
                          ? (data.meta as { counterType: "numeric" | "lower-roman" | "upper-roman" | "lower-alpha" | "upper-alpha" }).counterType
                          : undefined,
                    }
                  : undefined,
              items: normalizeListItems(data.items),
            },
          });
        }
        break;

      case "quote":
        if (typeof data?.text === "string") {
          normalized.push({
            type: "quote",
            data: {
              text: data.text,
              caption: typeof data.caption === "string" ? data.caption : undefined,
              alignment:
                data.alignment === "left" || data.alignment === "center"
                  ? data.alignment
                  : undefined,
            },
          });
        }
        break;

      case "embed":
        {
          const embedTunes = "tunes" in block && block.tunes && typeof block.tunes === "object"
            ? (block.tunes as { embedSize?: { width?: number; height?: number } })
            : undefined;

        normalized.push({
          type: "embed",
          data: {
            service: typeof data?.service === "string" ? data.service : undefined,
            source: typeof data?.source === "string" ? data.source : undefined,
            embed: typeof data?.embed === "string" ? data.embed : undefined,
            width: typeof data?.width === "number" ? data.width : undefined,
            height: typeof data?.height === "number" ? data.height : undefined,
            caption: typeof data?.caption === "string" ? data.caption : undefined,
          },
          tunes: embedTunes,
        });
      }
        break;

      case "delimiter":
        normalized.push({
          type: "delimiter",
          data: {},
        });
        break;

      default:
        // ignore unsupported blocks
        break;
    }
  }

  return normalized;
}
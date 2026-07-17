import { EditorContent } from "@/types/editor";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function getCollisionSafeSlug(
  text: string,
  slugCounts: Map<string, number>
) {
  const baseSlug = slugify(text) || "section";
  const nextCount = (slugCounts.get(baseSlug) ?? 0) + 1;
  slugCounts.set(baseSlug, nextCount);

  if (nextCount === 1) {
    return baseSlug;
  }

  return `${baseSlug}-${nextCount}`;
}

export function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/&#xA0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ");
}

function stripHtml(text: string) {
  return decodeHtmlEntities(text).replace(/<\/?[^>]+(>|$)/g, "");
}

function sanitizeHeadingText(text: string) {
  return stripHtml(text).replace(/\s+/g, " ").trim();
}

function countWords(text: string) {
  const normalized = stripHtml(text).trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).length;
}

function countListItemWords(item: unknown): number {
  if (typeof item === "string") {
    return countWords(item);
  }

  if (Array.isArray(item)) {
    return item.reduce((total, nested) => total + countListItemWords(nested), 0);
  }

  if (typeof item === "object" && item !== null) {
    const candidate = item as {
      content?: unknown;
      text?: unknown;
      items?: unknown;
    };

    let total = 0;

    if (typeof candidate.content === "string") {
      total += countWords(candidate.content);
    }

    if (typeof candidate.text === "string") {
      total += countWords(candidate.text);
    }

    if (Array.isArray(candidate.items)) {
      total += candidate.items.reduce(
        (nestedTotal, nestedItem) => nestedTotal + countListItemWords(nestedItem),
        0
      );
    }

    return total;
  }

  return 0;
}

function getTextField(data: unknown) {
  if (typeof data !== "object" || data === null || !("text" in data)) {
    return "";
  }

  const text = (data as { text?: unknown }).text;
  return typeof text === "string" ? text : "";
}

function getHeaderLevel(data: unknown) {
  if (typeof data !== "object" || data === null || !("level" in data)) {
    return 2;
  }

  const level = (data as { level?: unknown }).level;
  return typeof level === "number" ? level : 2;
}

function getListItems(data: unknown): unknown[] {
  if (typeof data !== "object" || data === null || !("items" in data)) {
    return [];
  }

  const items = (data as { items?: unknown }).items;
  return Array.isArray(items) ? items : [];
}

export function processBlogContent(content: EditorContent) {
  let wordCount = 0;
  const toc: TocItem[] = [];
  const slugCounts = new Map<string, number>();

  for (const block of content.blocks) {

    // WORD COUNT
    if (block.type === "paragraph") {
      const text = getTextField(block.data);
      wordCount += countWords(text);
    }

    if (block.type === "header") {
      const text = getTextField(block.data);
      const level = getHeaderLevel(block.data);
      const tocText = sanitizeHeadingText(text);

      wordCount += countWords(text);

      const id = getCollisionSafeSlug(text, slugCounts);

      toc.push({
        id,
        text: tocText,
        level,
      });
    }

    if (block.type === "list") {
      const items = getListItems(block.data);

      for (const item of items) {
        wordCount += countListItemWords(item);
      }
    }
  }

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return {
    readingTime,
    toc,
  };
}

export function slugify(text: string) {
  return stripHtml(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
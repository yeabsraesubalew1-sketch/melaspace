import type { EditorContent } from "@/types/editor";
import { getCollisionSafeSlug } from "@/lib/blog-utils";
import { normalizeEditorContent } from "./normalize";
import DividerBlock from "./blocks/DividerBlock";
import EmbedBlock from "./blocks/EmbedBlock";
import HeaderBlock from "./blocks/HeaderBlock";
import ListBlock from "./blocks/ListBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import QuoteBlock from "./blocks/QuoteBlock";

interface Props {
  content: EditorContent;
  openLinksInNewTab?: boolean;
}

function enforceAnchorsOpenInNewTab(html: string) {
  return html.replace(/<a\b([^>]*)>/gi, (_match, rawAttributes: string) => {
    const cleanedAttributes = rawAttributes
      .replace(/\starget\s*=\s*(["']).*?\1/gi, "")
      .replace(/\srel\s*=\s*(["']).*?\1/gi, "");

    return `<a${cleanedAttributes} target="_blank" rel="noopener noreferrer">`;
  });
}

function mapHtmlStrings(value: unknown): unknown {
  if (typeof value === "string") {
    return value.includes("<a")
      ? enforceAnchorsOpenInNewTab(value)
      : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapHtmlStrings(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        mapHtmlStrings(nestedValue),
      ])
    );
  }

  return value;
}

export default function Renderer({ content, openLinksInNewTab = false }: Props) {
  const resolvedContent = openLinksInNewTab
    ? (mapHtmlStrings(content) as EditorContent)
    : content;
  const blocks = normalizeEditorContent(resolvedContent);
  const headingSlugCounts = new Map<string, number>();

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="editorjs-content">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "header":
            return (
              <HeaderBlock
                key={key}
                block={block}
                id={getCollisionSafeSlug(block.data.text, headingSlugCounts)}
              />
            );
          case "paragraph":
            return <ParagraphBlock key={key} block={block} />;
          case "list":
            return <ListBlock key={key} block={block} />;
          case "quote":
            return <QuoteBlock key={key} block={block} />;
          case "embed":
            return <EmbedBlock key={key} block={block} />;
          case "delimiter":
            return <DividerBlock key={key} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

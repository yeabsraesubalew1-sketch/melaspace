import type { EditorContent } from "@/types/editor";
import { getCollisionSafeSlug } from "@/lib/blog-utils";
import { normalizeEditorContent } from "./normalize";
import DividerBlock from "./blocks/DividerBlock";
import EmbedBlock from "./blocks/EmbedBlock";
import HeaderBlock from "./blocks/HeaderBlock";
import ListBlock from "./blocks/ListBlock";
import ParagraphBlock from "./blocks/ParagraphBlock";
import QuoteBlock from "./blocks/QuoteBlock";
import ImageBlock from "./blocks/ImageBlock";
import FileBlock from "./blocks/FileBlock";
import ResourceMentionHoverCard from "@/components/resources/ResourceMentionHoverCard";

import type { ResourceItem } from "@/types/api";

interface Props {
  content: EditorContent;
  openLinksInNewTab?: boolean;
  blogTitle?: string;
  linkedResources?: ResourceItem[];
}

function sanitizeResourceMentions(
  html: string,
  validSlugs?: Set<string>,
  validIds?: Set<string>
): string {
  if (!validSlugs || !validIds) {
    return html;
  }

  return html.replace(
    /<a\b([^>]*class=["'][^"']*resource-mention[^"']*["'][^>]*)>(.*?)<\/a>/gi,
    (fullMatch, attributes: string, innerText: string) => {
      const slugMatch = attributes.match(/data-resource-slug=["']([^"']+)["']/i);
      const idMatch = attributes.match(/data-resource-id=["']([^"']+)["']/i);

      const slug = slugMatch ? slugMatch[1] : "";
      const id = idMatch ? idMatch[1] : "";

      const isValid = (slug && validSlugs.has(slug)) || (id && validIds.has(id));

      if (isValid) {
        return fullMatch;
      }

      // Fail-safe: Resource is drafted, trashed, or deleted -> unwrap into clean text
      return innerText.replace(/^📎\s*/, "");
    }
  );
}

function enforceAnchorsOpenInNewTab(html: string) {
  return html.replace(/<a\b([^>]*)>/gi, (_match, rawAttributes: string) => {
    const cleanedAttributes = rawAttributes
      .replace(/\starget\s*=\s*(["']).*?\1/gi, "")
      .replace(/\srel\s*=\s*(["']).*?\1/gi, "");

    return `<a${cleanedAttributes} target="_blank" rel="noopener noreferrer">`;
  });
}

function mapHtmlStrings(
  value: unknown,
  openInNewTab: boolean,
  validSlugs?: Set<string>,
  validIds?: Set<string>
): unknown {
  if (typeof value === "string") {
    let processed = value;
    if (processed.includes("resource-mention")) {
      processed = sanitizeResourceMentions(processed, validSlugs, validIds);
    }
    if (openInNewTab && processed.includes("<a")) {
      processed = enforceAnchorsOpenInNewTab(processed);
    }
    return processed;
  }

  if (Array.isArray(value)) {
    return value.map((item) => mapHtmlStrings(item, openInNewTab, validSlugs, validIds));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        mapHtmlStrings(nestedValue, openInNewTab, validSlugs, validIds),
      ])
    );
  }

  return value;
}

export default function Renderer({
  content,
  openLinksInNewTab = false,
  blogTitle,
  linkedResources,
}: Props) {
  const validSlugs = linkedResources ? new Set(linkedResources.map((r) => r.slug)) : undefined;
  const validIds = linkedResources ? new Set(linkedResources.map((r) => r.id)) : undefined;

  const resolvedContent = mapHtmlStrings(
    content,
    openLinksInNewTab,
    validSlugs,
    validIds
  ) as EditorContent;
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
          case "image":
            return <ImageBlock key={key} block={block} blogTitle={blogTitle} />;
          case "file":
            return <FileBlock key={key} block={block} />;
          default:
            return null;
        }
      })}
      <ResourceMentionHoverCard />
    </div>
  );
}

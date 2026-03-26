import type { EditorContent } from "@/types/editor";

type ParagraphBlock = {
  type: "paragraph";
  data: { text: string };
};

export function generateExcerpt(content: EditorContent, maxLength = 200) {
  const fallback = "Untitled blog post";

  if (!content?.blocks?.length) {
    return fallback;
  }

  for (const block of content.blocks) {
    if (block.type === "paragraph" && (block as ParagraphBlock).data?.text) {
      const plainText = (block as ParagraphBlock).data.text.replace(/<[^>]+>/g, "");

      if (plainText.length <= maxLength) {
        return plainText;
      }

      return plainText.slice(0, maxLength).trim() + "...";
    }
  }

  return fallback;
}
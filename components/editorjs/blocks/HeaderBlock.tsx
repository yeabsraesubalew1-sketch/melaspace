import type { HeaderBlock as HeaderBlockType } from "../types";
import type { ElementType } from "react";
import { decodeHtmlEntities } from "@/lib/blog-utils";

interface Props {
  block: HeaderBlockType;
  id?: string;
}

export default function HeaderBlock({ block, id }: Props) {
  const { level, text } = block.data;
  const resolvedId = id ?? "section";
  // Enforce minimum h2 inside blog body to ensure page h1 remains unique
  const safeLevel = Math.min(Math.max(level, 2), 6) as 2 | 3 | 4 | 5 | 6;

  const Tag = `h${safeLevel}` as ElementType;

  const sizeMap: Record<number, string> = {
    2: "text-3xl",
    3: "text-2xl",
    4: "text-xl",
    5: "text-lg",
    6: "text-base",
  };

  return (
    <Tag
      id={resolvedId}
      className={`${sizeMap[safeLevel]} font-semibold mt-10 mb-4`}
      dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(text) }}
    />
  );
}
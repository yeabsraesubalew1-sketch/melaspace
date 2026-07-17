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
  const safeLevel = Math.min(Math.max(level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;

  const Tag = `h${safeLevel}` as ElementType;

  const sizeMap = {
    1: "text-4xl",
    2: "text-3xl",
    3: "text-2xl",
    4: "text-xl",
    5: "text-lg",
    6: "text-base",
  } as const;

  return (
    <Tag
      id={resolvedId}
      className={`${sizeMap[safeLevel]} font-semibold mt-10 mb-4`}
      dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(text) }}
    />
  );
}
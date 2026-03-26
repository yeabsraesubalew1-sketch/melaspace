import type { ParagraphBlock as ParagraphBlockType } from "../types";

interface Props {
  block: ParagraphBlockType;
}

export default function ParagraphBlock({ block }: Props) {
  return (
    <p
  className="leading-7 text-[17px] my-4"
  dangerouslySetInnerHTML={{ __html: block.data.text }}
/>
  );
}
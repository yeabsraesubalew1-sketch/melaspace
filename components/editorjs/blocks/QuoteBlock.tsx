import type { QuoteBlock as QuoteBlockType } from "../types";

interface Props {
  block: QuoteBlockType;
}

export default function QuoteBlock({ block }: Props) {
  const { text, caption } = block.data;

  return (
    <blockquote className="border-l-4 pl-4 italic my-8">
      <p
        dangerouslySetInnerHTML={{ __html: text }}
      />

      {caption && (
        <footer
          className="text-sm mt-2 opacity-70"
          dangerouslySetInnerHTML={{ __html: caption }}
        />
      )}
    </blockquote>
  );
}
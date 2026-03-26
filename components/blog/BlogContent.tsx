import type { EditorContent } from "@/types/editor";
import EditorJSRenderer from "@/components/editorjs/Renderer";
import TableOfContents from "./TableOfContents";
import { processBlogContent } from "@/lib/blog-utils";

interface Props {
  content: EditorContent;
}

export default function BlogContent({ content }: Props) {
  const { toc } = processBlogContent(content);

  return (
    <div className="grid lg:grid-cols-[250px_1fr] gap-12">

      {/* toc */}
      <aside className="hidden lg:block lg:sticky lg:top-24 self-start border-r border-neutral-200 pr-6 overflow-x-hidden">
        <TableOfContents toc={toc} />
      </aside>

      {/* article */}
      <article className="mx-auto max-w-3xl px-4 py-10">
        <EditorJSRenderer content={content} />
      </article>

    </div>
  );
} 
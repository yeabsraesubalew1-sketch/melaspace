interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  toc: TocItem[];
}

function getIndentClass(level: number) {
  if (level <= 1) return "ml-0";
  if (level === 2) return "ml-2";
  if (level === 3) return "ml-4";
  if (level === 4) return "ml-6";
  return "ml-8";
}

export default function TableOfContents({ toc }: Props) {

  if (toc.length === 0) return null;

  return (
    <aside className="h-fit overflow-x-hidden">

      <h3 className="font-semibold mb-3">
        On this page
      </h3>

      <ul className="space-y-2 text-sm">

        {toc.map((item) => (
          <li
            key={item.id}
            className={getIndentClass(item.level)}
          >
            <a
              href={`#${item.id}`}
              className="block break-words whitespace-normal leading-snug hover:underline opacity-80"
            >
              {item.text}
            </a>
          </li>
        ))}

      </ul>

    </aside>
  );
}
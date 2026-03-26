"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
  basePath?: string;
}

export default function CategoryPills({ categories, basePath = "/blogs" }: Props) {
  const params = useSearchParams();

  const current = params.get("category");

  function getHref(slug?: string) {
    const newParams = new URLSearchParams(params.toString());

    if (slug) {
      newParams.set("category", slug);
    } else {
      newParams.delete("category");
    }

    newParams.delete("page");

    const query = newParams.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div className="flex gap-2 flex-wrap mb-6" aria-label="Filter by category">
      <Link
        href={getHref()}
        aria-current={!current ? "page" : undefined}
        className={`rounded-full border px-3 py-1 text-sm transition hover:cursor-pointer ${
          !current
            ? "bg-foreground text-background border-foreground"
            : "border-border hover:bg-surface-muted"
        }`}
      >
        All
      </Link>

      {categories.map((cat) => (
        <Link
          key={cat._id}
          href={getHref(cat.slug)}
          aria-current={current === cat.slug ? "page" : undefined}
          className={`rounded-full border px-3 py-1 text-sm transition hover:cursor-pointer ${
            current === cat.slug
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:bg-surface-muted"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
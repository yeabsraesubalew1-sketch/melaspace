"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
  basePath?: string;
}

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default function CategoryPills({
  categories,
  basePath = "/blogs",
}: Props) {
  const params = useSearchParams();
  const current = params.get("category");

  const scrollRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLAnchorElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, categories]);

  // Center active category pill on initial load or change
  useEffect(() => {
    if (activePillRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [current]);

  const scrollByAmount = (distance: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: distance, behavior: "smooth" });
  };

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

  if (categories.length === 0) return null;

  return (
    <div className="relative mb-6 w-full" aria-label="Filter by category">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-220)}
          aria-label="Scroll categories left"
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-xs transition hover:bg-surface-muted hover:scale-105 cursor-pointer"
        >
          <ChevronLeftIcon />
        </button>
      )}

      {/* Left Edge Gradient Fade */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-5 w-8 bg-gradient-to-r from-background via-background/80 to-transparent" />
      )}

      {/* Scrollable Pill Strip */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 text-xs sm:text-sm"
      >
        <Link
          href={getHref()}
          ref={!current ? activePillRef : null}
          aria-current={!current ? "page" : undefined}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 font-medium transition-all hover:cursor-pointer ${
            !current
              ? "bg-foreground text-background border-foreground shadow-2xs"
              : "border-border/80 bg-surface-muted/40 text-foreground/80 hover:bg-surface-muted hover:text-foreground hover:border-border"
          }`}
        >
          All
        </Link>

        {categories.map((cat) => {
          const isActive = current === cat.slug;
          return (
            <Link
              key={cat._id}
              ref={isActive ? activePillRef : null}
              href={getHref(cat.slug)}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 font-medium transition-all hover:cursor-pointer ${
                isActive
                  ? "bg-foreground text-background border-foreground shadow-2xs"
                  : "border-border/80 bg-surface-muted/40 text-foreground/80 hover:bg-surface-muted hover:text-foreground hover:border-border"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Right Edge Gradient Fade */}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-5 w-8 bg-gradient-to-l from-background via-background/80 to-transparent" />
      )}

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(220)}
          aria-label="Scroll categories right"
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur-xs transition hover:bg-surface-muted hover:scale-105 cursor-pointer"
        >
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}
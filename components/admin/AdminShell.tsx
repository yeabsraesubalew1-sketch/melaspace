"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

interface NavItem {
  label: string;
  href: string;
  indent?: boolean;
  exact?: boolean;
}

const navSections: Array<{ title?: string; items: NavItem[] }> = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        exact: true,
      },
    ],
  },
  {
    title: "Blogs",
    items: [
      {
        label: "All Posts",
        href: "/admin/blogs",
      },
      {
        label: "New Post",
        href: "/admin/blogs/new",
        indent: true,
      },
      {
        label: "Drafts",
        href: "/admin/blogs/drafts",
        indent: true,
      },
      {
        label: "Published",
        href: "/admin/blogs/publishes",
        indent: true,
      },
    ],
  },
  {
    title: "Forms",
    items: [
      {
        label: "Inquiry",
        href: "/admin/forms/inquiry",
        indent: true,
      },
      {
        label: "Waitlist",
        href: "/admin/forms/waitlist",
        indent: true,
      },
    ],
  },
  {
    title: "Tools",
    items: [
      {
        label: "Test Editor",
        href: "/admin/test-editor",
      },
    ],
  },
];

function isItemActive(pathname: string, item: NavItem) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function isSectionActive(pathname: string, items: NavItem[]) {
  return items.some((item) => isItemActive(pathname, item));
}

type DbHealth = "checking" | "ok" | "down";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbHealth, setDbHealth] = useState<DbHealth>("checking");
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);
  const pathname = usePathname();

  const closeSidebar = () => setIsSidebarOpen(false);

  const checkDbHealth = async () => {
    setIsRefreshingHealth(true);

    try {
      const res = await fetch("/api/admin/health/db", {
        method: "GET",
        cache: "no-store",
      });

      setDbHealth(res.ok ? "ok" : "down");
    } catch {
      setDbHealth("down");
    } finally {
      setIsRefreshingHealth(false);
    }
  };

  useEffect(() => {
    checkDbHealth();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle sidebar"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-background text-foreground transition hover:bg-surface-muted lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1.5">
              <span
                className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${
                  isSidebarOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${
                  isSidebarOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${
                  isSidebarOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>

          <Link href="/" className="text-lg font-semibold tracking-tight">
            Mela Space
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={checkDbHealth}
            disabled={isRefreshingHealth}
            className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-2 py-1 text-xs text-foreground/75 transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70"
            aria-live="polite"
            title="Check database connectivity"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                dbHealth === "ok"
                  ? "bg-emerald-500"
                  : dbHealth === "down"
                    ? "bg-rose-500"
                    : "bg-amber-400"
              }`}
              aria-hidden="true"
            />
            <span>
              DB {dbHealth === "ok" ? "online" : dbHealth === "down" ? "offline" : "checking"}
            </span>
          </button>

          <LogoutButton />
        </div>
      </header>

      <div className="relative flex flex-1">
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className={`fixed inset-x-0 bottom-0 top-16 z-30 bg-background/70 lg:hidden ${
            isSidebarOpen ? "block" : "hidden"
          }`}
        />

        <aside
          className={`fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-border bg-background transition-transform duration-200 ease-out lg:static lg:top-auto lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="space-y-3 px-3 py-3 text-sm">
            {navSections.map((section) => {
              const sectionActive = isSectionActive(pathname, section.items);

              return (
                <div key={section.title ?? section.items[0].href} className="space-y-1">
                  {section.title && (
                    <p
                      className={`px-2 text-xs font-medium uppercase tracking-wide ${
                        sectionActive ? "text-foreground" : "text-foreground/55"
                      }`}
                    >
                      {section.title}
                    </p>
                  )}

                  {section.items.map((item) => {
                    const active = isItemActive(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSidebar}
                        aria-current={active ? "page" : undefined}
                        className={`relative block rounded-md py-2 pr-3 transition ${
                          item.indent ? "pl-8" : "pl-3"
                        } ${
                          active
                            ? "bg-surface-muted text-foreground"
                            : "text-foreground/80 hover:bg-surface-muted"
                        }`}
                      >
                        {active && (
                          <span className="absolute left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-foreground" />
                        )}
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        <section className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8" aria-label="Admin content">
          <div
            className="
              pointer-events-none
              absolute inset-0
              bg-[linear-gradient(to_right,hsl(var(--border))/0.35_1px,transparent_1px),
                  linear-gradient(to_bottom,hsl(var(--border))/0.35_1px,transparent_1px)]
              bg-size-[14px_24px]
              mask-[radial-gradient(ellipse_80%_60%_at_50%_0%,#000_65%,transparent_110%)]
            "
          />

          <Suspense
            fallback={
              <div className="relative z-10 mx-auto w-full max-w-7xl" />
            }
          >
            <div className="relative z-10 mx-auto w-full max-w-7xl">{children}</div>
          </Suspense>
        </section>
      </div>
    </div>
  );
}
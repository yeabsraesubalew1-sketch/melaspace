"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/blogs", label: "Blog" },
    { href: "/resources", label: "Resources" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-md bg-background/70 border-b border-border"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
          onClick={() => setMobileOpen(false)}
        >
          Mela Space
        </Link>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-background/70 text-foreground transition hover:bg-background"
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span
              className={cn(
                "block h-0.5 w-5 bg-current transition-transform duration-200",
                mobileOpen && "translate-y-2 rotate-45"
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-5 bg-current transition-opacity duration-200",
                mobileOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-5 bg-current transition-transform duration-200",
                mobileOpen && "-translate-y-2 -rotate-45"
              )}
            />
          </span>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-foreground/80">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition border-b-2 pb-1",
                isActive(link.href)
                  ? "text-foreground border-foreground/70"
                  : "border-transparent hover:text-foreground hover:border-foreground/20"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Nav Links */}
      <div
        className={cn(
          "md:hidden absolute left-0 top-full w-full overflow-hidden border-b border-border bg-background/95 backdrop-blur-md transition-all duration-300",
          mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 text-sm text-foreground/80">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "transition border-l-2 pl-2",
                isActive(link.href)
                  ? "text-foreground border-foreground/70"
                  : "border-transparent hover:text-foreground hover:border-foreground/20"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
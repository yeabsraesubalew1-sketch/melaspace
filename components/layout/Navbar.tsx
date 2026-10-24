"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import ProfileModal from "@/components/profile/ProfileModal";
import ProposePostModal from "@/components/proposal/ProposePostModal";
import SavedPostsModal from "@/components/blog/SavedPostsModal";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [savedPostsModalOpen, setSavedPostsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/blogs", label: "Blog" },
    { href: "/resources", label: "Resources" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const isAdmin = ["root_admin", "super_admin", "manager", "author"].includes(
    session?.user?.role || ""
  );

  const roleLabels: Record<string, string> = {
    root_admin: "Root Admin",
    super_admin: "Super Admin",
    manager: "Manager",
    author: "Author",
    user: "Explorer",
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 w-full z-40 transition-all duration-300",
          scrolled
            ? "backdrop-blur-md bg-background/85 border-b border-border/70 shadow-xs"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          {/* Editorial Wordmark */}
          <Link
            href="/"
            className="group flex items-baseline gap-1.5 py-1 transition-opacity hover:opacity-85"
            onClick={() => setMobileOpen(false)}
          >
            <span className="font-serif text-xl font-bold tracking-tight text-foreground">
              Mela
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/60">
              Space
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent/80 transition-transform duration-300 group-hover:scale-125" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-1 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Auth Button */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-8 w-20 animate-pulse rounded-full bg-surface-muted" />
            ) : session?.user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-border/80 bg-background/80 p-1 pr-2.5 transition hover:bg-surface-muted hover:border-foreground/30 focus:outline-none"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <DefaultAvatar name={session.user.name || "Explorer"} size="sm" />
                  <span className="hidden sm:inline-block max-w-[110px] truncate text-xs font-medium text-foreground">
                    {session.user.name?.split(" ")[0] || "Explorer"}
                  </span>
                  <svg
                    className={cn(
                      "h-3.5 w-3.5 text-foreground/50 transition-transform duration-200",
                      userDropdownOpen && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-background p-2 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95">
                    <div className="px-3 py-2 border-b border-border/70">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {session.user.name || "Explorer"}
                      </p>
                      <p className="text-xs text-foreground/60 truncate">{session.user.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-surface-muted border border-border text-foreground/75">
                        {roleLabels[session.user.role] || "Explorer"}
                      </span>
                    </div>

                    <div className="py-1 text-xs">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-foreground hover:bg-surface-muted transition"
                        >
                          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setSavedPostsModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-surface-muted transition text-left cursor-pointer"
                      >
                        <svg className="h-4 w-4 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Saved Posts
                      </button>

                      {!isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setProposeModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-surface-muted transition text-left cursor-pointer"
                        >
                          <svg className="h-4 w-4 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Propose a Post
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-surface-muted transition text-left cursor-pointer"
                      >
                        <svg className="h-4 w-4 text-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile Settings
                      </button>
                    </div>

                    <div className="pt-1 border-t border-border/70">
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition text-left cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-medium text-foreground transition hover:border-foreground/40 hover:bg-surface-muted"
              >
                <span>Sign in</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background/70 text-foreground transition hover:bg-background"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1.5">
                <span
                  className={cn(
                    "block h-0.5 w-4 bg-current transition-transform duration-200",
                    mobileOpen && "translate-y-2 rotate-45"
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 w-4 bg-current transition-opacity duration-200",
                    mobileOpen && "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 w-4 bg-current transition-transform duration-200",
                    mobileOpen && "-translate-y-2 -rotate-45"
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Links Drawer */}
        <div
          className={cn(
            "md:hidden absolute left-0 top-full w-full overflow-hidden border-b border-border bg-background/95 backdrop-blur-md transition-all duration-300",
            mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 text-sm text-foreground/80">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "transition border-l-2 pl-2",
                  isActive(link.href)
                    ? "text-foreground border-foreground/70 font-medium"
                    : "border-transparent hover:text-foreground hover:border-foreground/20"
                )}
              >
                {link.label}
              </Link>
            ))}

            {session?.user && (
              <div className="pt-2 border-t border-border flex flex-col gap-2">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="font-medium text-primary pl-2"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSavedPostsModalOpen(true);
                  }}
                  className="text-left pl-2 text-foreground/80 hover:text-foreground cursor-pointer"
                >
                  Saved Posts
                </button>
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setProposeModalOpen(true);
                    }}
                    className="text-left pl-2 text-foreground/80 hover:text-foreground cursor-pointer"
                  >
                    Propose a Post
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="text-left pl-2 text-foreground/80 hover:text-foreground cursor-pointer"
                >
                  Profile Settings
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Modals */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <ProposePostModal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
      />
      <SavedPostsModal
        isOpen={savedPostsModalOpen}
        onClose={() => setSavedPostsModalOpen(false)}
      />
    </>
  );
}
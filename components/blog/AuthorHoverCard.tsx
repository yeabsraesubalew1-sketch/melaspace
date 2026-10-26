"use client";

import React, { useState, useRef, useEffect } from "react";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import type { BlogAuthorPreview } from "@/types/api";

interface AuthorHoverCardProps {
  author?: BlogAuthorPreview;
  authorName: string;
  isAnonymous?: boolean;
  variant?: "dark" | "light";
  className?: string;
}

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function AuthorHoverCard({
  author,
  authorName,
  isAnonymous = false,
  variant = "light",
  className = "",
}: AuthorHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isDark = variant === "dark";
  const isMelaTeam = Boolean(author?.isMelaTeam || authorName === "Mela Team");
  const isTrulyAnonymous = Boolean((isAnonymous && authorName === "Anonymous") || authorName === "Anonymous");
  const hasAuthorCard = !isTrulyAnonymous && (!isAnonymous || isMelaTeam);

  const handleMouseEnter = () => {
    if (!hasAuthorCard) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), 120);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  // Close on outside click (for mobile touch taps)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabel = isMelaTeam
    ? "Official Team"
    : author?.role === "root_admin"
    ? "Root Admin"
    : author?.role === "super_admin"
    ? "Super Admin"
    : author?.role === "author"
    ? "Author"
    : "Author";

  const bioText = isMelaTeam
    ? "Official publications, curated insights, and editorial resources from the Mela Space team."
    : author?.bio?.trim() || "Contributing writer and thinker on Mela Space.";

  const joinedDate = formatJoinDate(author?.joinedAt);

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${className}`}
    >
      {/* Author Header Trigger */}
      <div
        onClick={() => hasAuthorCard && setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2.5 transition-opacity ${
          hasAuthorCard ? "cursor-pointer group select-none" : ""
        }`}
        role={hasAuthorCard ? "button" : undefined}
        tabIndex={hasAuthorCard ? 0 : undefined}
        aria-haspopup={hasAuthorCard ? "true" : undefined}
        aria-expanded={hasAuthorCard ? isOpen : undefined}
      >
        {isMelaTeam ? (
          <div
            className={`h-9 w-9 rounded-full bg-primary flex items-center justify-center font-bold text-sm shadow-xs shrink-0 select-none ${
              isDark
                ? "text-primary-foreground ring-2 ring-white/30"
                : "text-primary-foreground ring-2 ring-primary/20"
            }`}
          >
            M
          </div>
        ) : (
          <DefaultAvatar
            name={authorName}
            size="md"
            className={`shrink-0 transition-transform duration-200 ${
              hasAuthorCard ? "group-hover:scale-105" : ""
            }`}
          />
        )}

        <div>
          <span
            className={`font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? "text-white group-hover:text-primary-foreground"
                : "text-foreground group-hover:text-primary"
            }`}
          >
            {authorName}
            {isMelaTeam && (
              <span
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold"
                title="Verified Staff"
              >
                ✓
              </span>
            )}
            {hasAuthorCard && (
              <svg
                className={`h-3 w-3 opacity-0 group-hover:opacity-70 transition-all ${
                  isDark ? "text-white" : "text-foreground"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </span>
          <span
            className={`block text-[11px] ${
              isDark ? "text-white/60" : "text-foreground/50"
            }`}
          >
            {isTrulyAnonymous ? "Anonymous Contributor" : roleLabel}
          </span>
        </div>
      </div>

      {/* Floating Author Popover Card */}
      {hasAuthorCard && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute left-0 bottom-full mb-2.5 z-50 w-72 sm:w-80 rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-200 pointer-events-auto ${
            isOpen
              ? "opacity-100 translate-y-0 scale-100 visible"
              : "opacity-0 translate-y-2 scale-95 invisible pointer-events-none"
          } ${
            isDark
              ? "border-white/20 bg-neutral-900/90 text-white shadow-black/40"
              : "border-border/80 bg-background/95 text-foreground shadow-black/10"
          }`}
        >
          {/* Top Row: Avatar & Identity */}
          <div className="flex items-start gap-3">
            {isMelaTeam ? (
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm shrink-0 ring-2 ring-primary/30">
                M
              </div>
            ) : (
              <DefaultAvatar name={authorName} size="lg" className="shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-sm truncate">{authorName}</h4>
                {isMelaTeam ? (
                  <span className="rounded-full bg-primary/20 text-primary border border-primary/30 px-2 py-0.2 text-[10px] font-semibold">
                    Staff ✓
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.2 text-[10px] font-medium">
                    {roleLabel}
                  </span>
                )}
              </div>

              {joinedDate && !isMelaTeam && (
                <span className="text-[11px] opacity-60 block mt-0.5">
                  Member since {joinedDate}
                </span>
              )}
              {isMelaTeam && (
                <span className="text-[11px] opacity-60 block mt-0.5">
                  Official Mela Space Account
                </span>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-xs leading-relaxed opacity-85 break-words">
              {bioText}
            </p>
          </div>

          {/* Subdued Footer Note */}
          <div className="mt-3 flex items-center justify-between text-[11px] opacity-50 pt-2 border-t border-border/20">
            <span>Mela Space Author</span>
            <span>Verified Profile</span>
          </div>
        </div>
      )}
    </div>
  );
}

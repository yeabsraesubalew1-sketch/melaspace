import React from "react";

interface DefaultAvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function DefaultAvatar({
  name,
  size = "md",
  className = "",
}: DefaultAvatarProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
    xl: "h-14 w-14 text-lg",
  };

  const getInitials = (n?: string) => {
    if (!n) return "";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-surface-muted border border-border text-foreground/80 font-medium select-none shadow-xs overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      title={name || "User Avatar"}
      aria-label={name || "User"}
    >
      {initials ? (
        <span>{initials}</span>
      ) : (
        <svg
          className="h-3/5 w-3/5 text-foreground/50"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DefaultAvatar from "@/components/ui/DefaultAvatar";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setName(json.data.name || "");
            setBio(json.data.bio || "");
          } else {
            setName(session?.user?.name || "");
          }
        })
        .catch(() => {
          setName(session?.user?.name || "");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, session]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }

      // Update client-side session immediately
      await update({ name: name.trim() });

      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabels: Record<string, { label: string; color: string }> = {
    root_admin: { label: "Root Administrator", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
    super_admin: { label: "Super Admin", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
    manager: { label: "Operations Manager", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    author: { label: "Content Author", color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    user: { label: "Explorer", color: "bg-neutral-500/10 text-neutral-600 border-neutral-500/30" },
  };

  const userRole = session?.user?.role || "user";
  const roleBadge = roleLabels[userRole] || roleLabels.user;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-semibold tracking-tight">Profile Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-surface-muted hover:text-foreground transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-foreground/60">Loading profile...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="flex items-center gap-4">
              <DefaultAvatar name={name || session?.user?.name || ""} size="xl" />
              <div>
                <p className="font-medium text-foreground">{session?.user?.email}</p>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge.color}`}
                >
                  {roleBadge.label}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label htmlFor="profile-name" className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-bio" className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                Bio (optional)
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief bio or description..."
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-foreground/50 focus:ring-1 focus:ring-foreground/50 resize-none"
              />
              <p className="text-right text-xs text-foreground/50">{bio.length}/300</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

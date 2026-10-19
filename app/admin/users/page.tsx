"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DefaultAvatar from "@/components/ui/DefaultAvatar";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: "root_admin" | "super_admin" | "manager" | "author" | "user";
  status: "active" | "kicked";
  bio?: string;
  createdAt: string;
}

export default function UsersManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const actorRole = session?.user?.role || "user";
  const actorEmail = session?.user?.email || "";

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search.trim()) params.set("q", search.trim());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load users");
      }

      setUsers(json.data.users);
      setTotal(json.data.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (targetUser: UserItem, newRole: string) => {
    if (newRole === targetUser.role) return;

    if (
      !confirm(
        `Are you sure you want to change ${targetUser.name}'s role from ${targetUser.role} to ${newRole}?`
      )
    ) {
      return;
    }

    setActionLoadingId(targetUser._id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser._id, newRole }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update role");
      }

      toast.success(json.message || "Role updated successfully");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleKickOut = async (targetUser: UserItem) => {
    if (
      !confirm(
        `Are you sure you want to kick out ${targetUser.name} (${targetUser.email})? Their active login session will be revoked immediately.`
      )
    ) {
      return;
    }

    setActionLoadingId(targetUser._id);
    try {
      const res = await fetch(`/api/admin/users?userId=${targetUser._id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to kick out user");
      }

      toast.success(json.message || "User kicked out and session revoked");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to kick out user");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnban = async (targetUser: UserItem) => {
    setActionLoadingId(targetUser._id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser._id, action: "unban" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to reinstate user");
      }

      toast.success(json.message || "Account reinstated");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reinstate user");
    } finally {
      setActionLoadingId(null);
    }
  };

  const roleBadges: Record<string, { label: string; className: string }> = {
    root_admin: { label: "Root Admin", className: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
    super_admin: { label: "Super Admin", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
    manager: { label: "Manager", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    author: { label: "Author", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    user: { label: "Explorer", className: "bg-neutral-500/10 text-neutral-600 border-neutral-500/30" },
  };

  const canManageTarget = (target: UserItem) => {
    if (target.role === "root_admin") return false;
    if (target.email === actorEmail) return false;
    if (actorRole === "root_admin") return true;
    if (actorRole === "super_admin") {
      return target.role !== "super_admin";
    }
    return false;
  };

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users & Admins</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Manage account roles, permissions, and instant session revocation.
          </p>
        </div>
        <div className="text-xs text-foreground/60 bg-surface-muted border border-border px-3 py-1.5 rounded-lg self-start sm:self-auto">
          Total Registered: <strong className="text-foreground">{total}</strong>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-xl border border-border bg-background/85 p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none transition focus:border-foreground/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="">All Roles</option>
            <option value="root_admin">Root Admin</option>
            <option value="super_admin">Super Admin</option>
            <option value="manager">Manager</option>
            <option value="author">Author</option>
            <option value="user">Explorer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="kicked">Kicked / Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-background/85 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/50 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-foreground/60">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-foreground/60">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const badge = roleBadges[u.role] || roleBadges.user;
                  const isBusy = actionLoadingId === u._id;
                  const canManage = canManageTarget(u);

                  return (
                    <tr key={u._id} className="hover:bg-surface-muted/30 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <DefaultAvatar name={u.name} size="md" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{u.name}</p>
                            <p className="text-xs text-foreground/60 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {u.status === "active" ? "Active" : "Kicked"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-foreground/60">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {canManage ? (
                          <div className="inline-flex items-center gap-2">
                            {/* Role Dropdown */}
                            <select
                              value={u.role}
                              disabled={isBusy}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground outline-none transition hover:bg-surface-muted cursor-pointer disabled:opacity-50"
                            >
                              {actorRole === "root_admin" && (
                                <option value="super_admin">Super Admin</option>
                              )}
                              <option value="manager">Manager</option>
                              <option value="author">Author</option>
                              <option value="user">Explorer</option>
                            </select>

                            {/* Kick Out or Unban */}
                            {u.status === "active" ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleKickOut(u)}
                                className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
                                title="Revoke session and kick out"
                              >
                                {isBusy ? "..." : "Kick Out"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleUnban(u)}
                                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                                title="Reinstate user account"
                              >
                                {isBusy ? "..." : "Reinstate"}
                              </button>
                            )}
                          </div>
                        ) : u.role === "root_admin" ? (
                          <span className="text-xs text-foreground/40 italic">Root Owner</span>
                        ) : u.email === actorEmail ? (
                          <span className="text-xs text-foreground/40 italic">Current User</span>
                        ) : (
                          <span className="text-xs text-foreground/40 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

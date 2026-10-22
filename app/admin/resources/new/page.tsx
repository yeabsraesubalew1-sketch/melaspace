import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResourceEditor from "@/components/admin/ResourceEditor";

const ALLOWED_ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

export default async function NewResourcePage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
    redirect("/admin/blogs");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 pb-16">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-foreground/50">
          <Link href="/admin/resources" className="underline underline-offset-4">
            Resources
          </Link>
          <span>/</span>
          <span>New</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create New Resource
        </h1>
        <p className="text-xs sm:text-sm text-foreground/60">
          Upload companion decks, workbooks, or toolkits to FileVault and configure public details.
        </p>
      </div>

      <ResourceEditor mode="create" />
    </div>
  );
}

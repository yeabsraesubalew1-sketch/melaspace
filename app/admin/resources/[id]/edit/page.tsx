import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { warmFileVaultConnection } from "@/lib/filevault";
import ResourceEditor from "@/components/admin/ResourceEditor";

const ALLOWED_ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditResourcePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
    redirect("/admin/blogs");
  }

  // Pre-warm FileVault TLS connection on the server
  warmFileVaultConnection();

  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 pb-16">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-foreground/50">
          <Link href="/admin/resources" className="underline underline-offset-4">
            Resources
          </Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit Resource
        </h1>
        <p className="text-xs sm:text-sm text-foreground/60">
          Modify file attachments, re-label deck components, or update linked companion articles.
        </p>
      </div>

      <ResourceEditor mode="edit" resourceId={id} />
    </div>
  );
}

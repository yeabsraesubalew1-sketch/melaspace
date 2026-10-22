import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { warmFileVaultConnection } from "@/lib/filevault";
import AdminResourcesDashboard from "@/components/admin/AdminResourcesDashboard";

export const dynamic = "force-dynamic";

const ALLOWED_ADMIN_ROLES = ["root_admin", "super_admin", "manager"];

export default async function AdminResourcesPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  if (!userRole || !ALLOWED_ADMIN_ROLES.includes(userRole)) {
    redirect("/admin/blogs");
  }

  // Pre-warm keep-alive TLS connection to FileVault on the server
  warmFileVaultConnection();

  return <AdminResourcesDashboard />;
}

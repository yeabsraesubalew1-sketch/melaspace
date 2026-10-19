import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROLES = ["root_admin", "super_admin", "manager", "author"];

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = (token.role as string) || "user";
    const status = (token.status as string) || "active";

    // Non-admins or kicked users cannot access /admin
    if (!ADMIN_ROLES.includes(role) || status === "kicked") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // If already logged in, redirect away from /login
  if (token && pathname === "/login") {
    const role = (token.role as string) || "user";
    if (ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
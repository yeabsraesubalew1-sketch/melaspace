import type { DefaultSession } from "next-auth";
import type { UserRole, UserStatus } from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      status: UserStatus;
      tokenVersion?: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    status: UserStatus;
    tokenVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    name?: string | null;
    role?: UserRole;
    status?: UserStatus;
    tokenVersion?: number;
    lastRevocationCheck?: number;
  }
}

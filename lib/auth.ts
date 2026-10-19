import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { connectDB } from "@/lib/db";
import User, { type UserRole, type UserStatus } from "@/models/User";
import Admin from "@/models/Admin";
import { isUserKicked } from "@/lib/auth-helpers";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const normalizedEmail = user.email.toLowerCase().trim();
      const rootEmail = (process.env.ROOT_ADMIN_EMAIL || "").toLowerCase().trim();
      const isRoot = Boolean(rootEmail && normalizedEmail === rootEmail);

      await connectDB();

      // Check if user already exists
      let dbUser = await User.findOne({ email: normalizedEmail });

      if (dbUser) {
        if (dbUser.status === "kicked") {
          // Deny login for kicked out users
          return false;
        }

        // Auto-heal root admin if email matches ROOT_ADMIN_EMAIL
        if (isRoot && dbUser.role !== "root_admin") {
          dbUser.role = "root_admin";
          await dbUser.save();
        }
      } else {
        // Grandfather legacy admins if they exist in Admin collection
        const legacyAdmin = await Admin.exists({ email: normalizedEmail });

        let initialRole: UserRole = "user";
        if (isRoot) {
          initialRole = "root_admin";
        } else if (legacyAdmin) {
          initialRole = "super_admin";
        }

        dbUser = await User.create({
          name: user.name || "Explorer",
          email: normalizedEmail,
          role: initialRole,
          status: "active",
          tokenVersion: 1,
        });
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      await connectDB();

      // If user just signed in or token doesn't have role or id
      if (user?.email || !token.role || !token.id) {
        const email = (user?.email || token.email)?.toLowerCase().trim();
        if (email) {
          const dbUser = await User.findOne({ email }).lean();
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.role = dbUser.role;
            token.status = dbUser.status;
            token.tokenVersion = dbUser.tokenVersion;
            token.lastRevocationCheck = Date.now();
          }
        }
      }

      // Handle client-side session update trigger (e.g. name update)
      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }

      // Periodic revocation check (every 60 seconds)
      const now = Date.now();
      if (token.email && (!token.lastRevocationCheck || now - token.lastRevocationCheck > 60_000)) {
        const kicked = await isUserKicked(token.email, token.tokenVersion);
        if (kicked) {
          token.status = "kicked";
        }
        token.lastRevocationCheck = now;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.email = (token.email as string) || "";
        session.user.name = (token.name as string) || session.user.name || "Explorer";
        session.user.role = (token.role as UserRole) || "user";
        session.user.status = (token.status as UserStatus) || "active";
        session.user.tokenVersion = token.tokenVersion;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

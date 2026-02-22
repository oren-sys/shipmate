/**
 * NextAuth.js Configuration
 *
 * Credentials provider for admin authentication.
 * Admin email/password stored in environment variables
 * (or Secret Manager in production).
 *
 * Environment:
 * - ADMIN_EMAIL: Admin login email
 * - ADMIN_PASSWORD: Admin login password
 * - NEXTAUTH_SECRET: JWT signing secret
 * - NEXTAUTH_URL: Base URL (e.g. https://shipmate.store)
 */

import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "אימייל", type: "email" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@shipmate.store";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        if (
          credentials?.email === adminEmail &&
          credentials?.password === adminPassword
        ) {
          return {
            id: "admin-1",
            email: adminEmail,
            name: "מנהל ShipMate",
            role: "admin",
          } as User & { role: string };
        }

        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User & { role?: string } }) {
      if (user) {
        token.role = user.role || "admin";
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
};

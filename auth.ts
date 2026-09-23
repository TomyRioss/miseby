import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@prisma/client";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role: UserRole;
    status: UserStatus;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    status: UserStatus;
  }
}

// Google OAuth solo si están las credenciales (TOM-203). Sin adapter y sin
// cambios de DB: linkea por email con cuentas credentials existentes.
// Señal para el FE: process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1"
// (inyectado en next.config.ts solo cuando el provider está activo).
export const isGoogleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const profile = await prisma.userProfile.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!profile) return null;

        if (profile.status === "suspended") {
          throw new Error("Tu cuenta fue suspendida. Contactá a soporte.");
        }

        const isValid = await bcrypt.compare(password, profile.passwordHash);
        if (!isValid) return null;

        return {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          status: profile.status,
        };
      },
    }),
    ...(isGoogleAuthEnabled
      ? [Google({ allowDangerousEmailAccountLinking: true })]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google solo entra si ya existe una cuenta credentials con ese email.
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        const profile = await prisma.userProfile.findUnique({
          where: { email },
          select: { status: true },
        });
        if (!profile || profile.status === "suspended") return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Credentials trae role/status en user; Google no → hidratar desde DB.
        const maybe = user as Partial<{
          role: UserRole;
          status: UserStatus;
        }>;
        if (maybe.role && maybe.status) {
          token.role = maybe.role;
          token.status = maybe.status;
        } else if (user.email) {
          const profile = await prisma.userProfile.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { role: true, status: true },
          });
          if (profile) {
            token.role = profile.role;
            token.status = profile.status;
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
});

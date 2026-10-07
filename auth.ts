import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@prisma/client";
import "next-auth/jwt";
import { allowRequest, trustedClientIp } from "@/lib/security/rate-limit";
import { credentialVersion } from "@/lib/security/credentials";

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
    credentialVersion?: string;
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
      async authorize(credentials, request) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || email.length > 254 || !password || Buffer.byteLength(password) > 72) return null;
        const ip = trustedClientIp(request.headers);
        if (!(await allowRequest("login-global", "all", 200, 60)) ||
            !(await allowRequest("login-account", email, 10, 900)) ||
            (ip && !(await allowRequest("login-ip", ip, 30, 60)))) return null;

        const profile = await prisma.userProfile.findUnique({
          where: { email: email.toLowerCase() },
        });
        const isValid = await bcrypt.compare(password, profile?.passwordHash ?? "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi");
        if (!profile || !isValid) return null;

        if (profile.status === "suspended") {
          throw new Error("Tu cuenta fue suspendida. Contactá a soporte.");
        }

        if (profile.status !== "active") {
          throw new Error("EMAIL_UNVERIFIED: la cuenta aún no verificó su email.");
        }

        return {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          status: profile.status,
        };
      },
    }),
    ...(isGoogleAuthEnabled
      ? [Google({})]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile: oauthProfile }) {
      // Google solo entra si ya existe una cuenta credentials con ese email.
      if (account?.provider === "google") {
        if (oauthProfile?.email_verified !== true) return false;
        const email = user.email?.toLowerCase();
        if (!email) return false;
        const profile = await prisma.userProfile.findUnique({
          where: { email },
          select: { status: true },
        });
        if (!profile || profile.status !== "active") return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Resolve OAuth identities to the local account and revoke stale credentials.
      const profile = await prisma.userProfile.findUnique({
        where: user?.email ? { email: user.email.toLowerCase() } : { id: token.sub ?? "" },
        select: { id: true, email: true, role: true, status: true, passwordHash: true },
      });
      if (!profile || profile.status !== "active") return null;
      const version = credentialVersion(profile.passwordHash, profile.email);
      if (!user && token.credentialVersion !== version) return null;
      token.sub = profile.id;
      token.email = profile.email;
      token.role = profile.role;
      token.status = profile.status;
      token.credentialVersion = version;
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

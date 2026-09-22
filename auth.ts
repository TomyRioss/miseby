import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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

        const isValid = await bcrypt.compare(password, profile.passwordHash);
        if (!isValid) return null;

        // Chequeo de suspensión DESPUÉS de validar la contraseña: así la
        // respuesta para "email inexistente", "contraseña mal" y "suspendida"
        // es idéntica sin la contraseña correcta (no enumera usuarios).
        if (profile.status === "suspended") {
          throw new Error("Tu cuenta fue suspendida. Contactá a soporte.");
        }

        return {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          status: profile.status,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
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

"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function AuthSessionProvider({ children, session }: { children: React.ReactNode; session: Session | null }) {
  // Sesión inicial del servidor: el provider NO fetchea al montar.
  // Sin esto cada mount (cada tab × StrictMode × cada HMR) disparaba un GET /api/auth/session.
  // Sin refetch por foco: nada en el cliente lee la sesión (solo signIn/signOut).
  return <SessionProvider session={session ?? undefined} refetchOnWindowFocus={false}>{children}</SessionProvider>;
}

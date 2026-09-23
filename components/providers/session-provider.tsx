"use client";

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  // Sin refetch por foco: nada en el cliente lee la sesión (solo signIn/signOut),
  // y con el preview en iframe + HMR cada foco disparaba un GET /api/auth/session.
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}

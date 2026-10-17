import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// auth() valida estado, rol y credencial en el callback JWT; compartir su resultado
// evita repetir esa validación y confundir un error de infraestructura con logout.
export const getAuthSession = cache(async () => auth());

export const getCurrentUser = cache(async () => {
  const session = await getAuthSession();
  return session?.user ?? null;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function getAccountDisplay() {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { name: true },
  });
  return { name: profile?.name ?? "Cuenta", email: user.email };
}

export type AccountDisplay = NonNullable<Awaited<ReturnType<typeof getAccountDisplay>>>;

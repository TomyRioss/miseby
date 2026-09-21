import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser) return null;
  // Estado fresco desde DB: una suspensión posterior al login bloquea la sesión.
  const profile = await prisma.userProfile
    .findUnique({
      where: { id: sessionUser.id },
      select: { role: true, status: true },
    })
    .catch(() => null);
  if (!profile || profile.status === "suspended") return null;
  return { ...sessionUser, role: profile.role, status: profile.status };
}

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

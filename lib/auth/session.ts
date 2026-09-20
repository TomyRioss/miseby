import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
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

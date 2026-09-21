import "server-only";
import { prisma } from "@/lib/prisma";
import type { UserStatus } from "@prisma/client";

export type SettableUserStatus = Extract<UserStatus, "active" | "suspended">;

export async function setUserStatus(id: string, status: SettableUserStatus) {
  const existing = await prisma.userProfile.findUnique({ where: { id } });
  if (!existing) throw new Error("Usuario no encontrado");
  if (existing.status === status) return existing;
  return prisma.userProfile.update({ where: { id }, data: { status } });
}

export async function deleteUser(id: string) {
  const existing = await prisma.userProfile.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!existing) throw new Error("Usuario no encontrado");
  if (existing.role === "platform_owner") {
    throw new Error("No se puede eliminar a un platform_owner.");
  }

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
    prisma.organizationMember.deleteMany({ where: { userId: id } }),
    prisma.invitation.deleteMany({ where: { invitedById: id } }),
    prisma.userProfile.delete({ where: { id } }),
  ]);
}

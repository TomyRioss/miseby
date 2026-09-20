import "server-only";
import { prisma } from "@/lib/prisma";

export async function getOnboardingStatus(
  userId: string
): Promise<{ completed: boolean }> {
  const member = await prisma.organizationMember.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  if (!member) return { completed: false };

  const organization = await prisma.organization.findUnique({
    where: { id: member.organizationId },
    select: { phone: true, city: true },
  });
  if (!organization) return { completed: false };

  const completed = Boolean(organization.phone?.trim() && organization.city?.trim());
  return { completed };
}

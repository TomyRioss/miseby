import "server-only";
import { prisma } from "@/lib/prisma";
import { requireBusinessUser } from "@/lib/auth/guards";
import type { OrganizationMemberRole } from "@prisma/client";

export type OrgRole = OrganizationMemberRole;

export async function getOrgRole(userId: string, orgId: string): Promise<OrgRole | null> {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
    select: { role: true, status: true },
  });
  if (!member || member.status !== "active") return null;
  return member.role;
}

export async function requireOrgOwner(orgId: string) {
  const user = await requireBusinessUser();
  const role = await getOrgRole(user.id, orgId);
  if (role !== "business_owner") throw new Error("Solo el propietario puede hacer esto.");
  return { user, role };
}

export async function requireOrgManager(orgId: string) {
  const user = await requireBusinessUser();
  const role = await getOrgRole(user.id, orgId);
  if (role !== "business_owner" && role !== "business_admin") {
    throw new Error("No tenés permisos para gestionar miembros.");
  }
  return { user, role };
}

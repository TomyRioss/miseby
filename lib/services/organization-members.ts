import "server-only";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit";
import { createInvitation } from "@/lib/services/invitations";
import type {
  OrganizationMemberRole,
  OrganizationMemberStatus,
  Prisma,
} from "@prisma/client";

export type OrgMemberRoleInput = Extract<
  OrganizationMemberRole,
  "business_owner" | "business_admin" | "business_member"
>;
export type OrgMemberStatusInput = Extract<OrganizationMemberStatus, "active" | "inactive">;

export async function inviteOrganizationMember(
  organizationId: string,
  input: { email: string; role: OrgMemberRoleInput },
  actorUserId: string
) {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) throw new Error("Negocio no encontrado");

  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email inválido");

  const existingUser = await prisma.userProfile.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: existingUser.id } },
    });
    if (existingMember && existingMember.status === "active") {
      throw new Error("Ese usuario ya es miembro del negocio.");
    }
  }

  const pending = await prisma.invitation.findFirst({
    where: { organizationId, email, status: "pending" },
  });
  if (pending) throw new Error("Ya existe una invitación pendiente para ese email.");

  const invitation = await createInvitation(
    { organizationId, email, role: input.role },
    actorUserId
  );

  await logAudit({
    action: "member_invited",
    actorUserId,
    organizationId,
    entityType: "invitation",
    entityId: invitation.id,
    metadata: { email, role: input.role } as Prisma.InputJsonValue,
  });

  return invitation;
}

export async function updateOrganizationMember(
  memberId: string,
  input: { role?: OrgMemberRoleInput; status?: OrgMemberStatusInput },
  actorUserId: string
) {
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Miembro no encontrado");
  if (input.role === undefined && input.status === undefined) {
    throw new Error("Sin cambios para aplicar.");
  }

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: {
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  });

  if (input.role !== undefined && input.role !== member.role) {
    await logAudit({
      action: "member_role_changed",
      actorUserId,
      organizationId: member.organizationId,
      entityType: "organization_member",
      entityId: member.id,
      metadata: { from: member.role, to: input.role } as Prisma.InputJsonValue,
    });
  }

  if (input.status !== undefined && input.status !== member.status) {
    await logAudit({
      action: input.status === "active" ? "member_role_changed" : "member_removed",
      actorUserId,
      organizationId: member.organizationId,
      entityType: "organization_member",
      entityId: member.id,
      metadata: { from: member.status, to: input.status, temporary: true } as Prisma.InputJsonValue,
    });
  }

  return updated;
}

export async function removeOrganizationMember(memberId: string, actorUserId: string) {
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Miembro no encontrado");

  await prisma.organizationMember.delete({ where: { id: memberId } });

  await logAudit({
    action: "member_removed",
    actorUserId,
    organizationId: member.organizationId,
    entityType: "organization_member",
    entityId: member.id,
    metadata: { removedUserId: member.userId, role: member.role } as Prisma.InputJsonValue,
  });
}

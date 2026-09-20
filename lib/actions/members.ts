"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireBusinessUser } from "@/lib/auth/guards";
import { getOrgRole } from "@/lib/auth/org-role";
import { createInvitation, cancelInvitation } from "@/lib/services/invitations";
import { logAudit } from "@/lib/services/audit";

type ActionResult = { ok: true } | { ok: false; error: string };

function fail(e: unknown, fallback: string): ActionResult {
  console.error("[members]", e);
  return { ok: false, error: e instanceof Error ? e.message : fallback };
}

const orgIdSchema = z.string().uuid();
const inviteSchema = z.object({
  orgId: orgIdSchema,
  email: z.string().email("Email inválido"),
  role: z.enum(["business_admin", "business_member"]),
});

async function actorWithRole(orgId: string) {
  const user = await requireBusinessUser();
  const role = await getOrgRole(user.id, orgId);
  if (role !== "business_owner" && role !== "business_admin") {
    throw new Error("No tenés permisos para gestionar miembros.");
  }
  return { user, role };
}

export async function listOrgMembers(orgId: string) {
  const parsed = orgIdSchema.safeParse(orgId);
  if (!parsed.success) return { ok: false as const, error: "Organización inválida" };
  try {
    await actorWithRole(parsed.data);
    const [members, invitations] = await Promise.all([
      prisma.organizationMember.findMany({
        where: { organizationId: parsed.data },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.invitation.findMany({
        where: { organizationId: parsed.data, status: "pending" },
        select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    return { ok: true as const, members, invitations };
  } catch (e) {
    return fail(e, "No se pudieron listar los miembros.");
  }
}

export async function inviteOrgMember(input: unknown): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  try {
    const { user, role: actorRole } = await actorWithRole(parsed.data.orgId);
    // Admin solo puede invitar business_member; owner puede invitar member o admin.
    // Nadie invita owner por esta vía.
    if (actorRole === "business_admin" && parsed.data.role !== "business_member") {
      return { ok: false, error: "Solo el propietario puede invitar administradores." };
    }
    await createInvitation(
      { organizationId: parsed.data.orgId, email: parsed.data.email, role: parsed.data.role },
      user.id
    );
    await logAudit({
      action: "member_invited",
      actorUserId: user.id,
      organizationId: parsed.data.orgId,
      entityType: "invitation",
      metadata: { email: parsed.data.email, role: parsed.data.role } as never,
    });
    revalidatePath("/dashboard/miembros");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo invitar.");
  }
}

export async function removeOrgMember(orgId: string, memberUserId: string): Promise<ActionResult> {
  if (!orgIdSchema.safeParse(orgId).success) return { ok: false, error: "Organización inválida" };
  if (!z.string().uuid().safeParse(memberUserId).success) return { ok: false, error: "Miembro inválido" };
  try {
    const { user, role: actorRole } = await actorWithRole(orgId);
    if (memberUserId === user.id) return { ok: false, error: "No podés quitarte a vos mismo." };
    const target = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: memberUserId } },
    });
    if (!target || target.status !== "active") return { ok: false, error: "Miembro no encontrado." };
    if (target.role === "business_owner") return { ok: false, error: "No se puede quitar al propietario." };
    if (actorRole === "business_admin" && target.role !== "business_member") {
      return { ok: false, error: "Solo el propietario puede quitar administradores." };
    }
    await prisma.organizationMember.update({
      where: { id: target.id },
      data: { status: "inactive" },
    });
    await logAudit({
      action: "member_removed",
      actorUserId: user.id,
      organizationId: orgId,
      entityType: "organization_member",
      entityId: target.id,
      metadata: { removedUserId: memberUserId, role: target.role } as never,
    });
    revalidatePath("/dashboard/miembros");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo quitar al miembro.");
  }
}

export async function changeOrgMemberRole(
  orgId: string,
  memberUserId: string,
  role: "business_admin" | "business_member"
): Promise<ActionResult> {
  if (!orgIdSchema.safeParse(orgId).success) return { ok: false, error: "Organización inválida" };
  if (!z.string().uuid().safeParse(memberUserId).success) return { ok: false, error: "Miembro inválido" };
  if (role !== "business_admin" && role !== "business_member") {
    return { ok: false, error: "Rol inválido." };
  }
  try {
    const { user, role: actorRole } = await actorWithRole(orgId);
    if (actorRole !== "business_owner") {
      return { ok: false, error: "Solo el propietario puede cambiar roles." };
    }
    if (memberUserId === user.id) return { ok: false, error: "No podés cambiar tu propio rol." };
    const target = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: memberUserId } },
    });
    if (!target || target.status !== "active") return { ok: false, error: "Miembro no encontrado." };
    if (target.role === "business_owner") return { ok: false, error: "No se puede cambiar el rol del propietario." };
    if (target.role === role) return { ok: true };
    await prisma.organizationMember.update({
      where: { id: target.id },
      data: { role },
    });
    await logAudit({
      action: "member_role_changed",
      actorUserId: user.id,
      organizationId: orgId,
      entityType: "organization_member",
      entityId: target.id,
      metadata: { changedUserId: memberUserId, from: target.role, to: role } as never,
    });
    revalidatePath("/dashboard/miembros");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo cambiar el rol.");
  }
}

export async function cancelOrgInvitation(orgId: string, invitationId: string): Promise<ActionResult> {
  if (!orgIdSchema.safeParse(orgId).success) return { ok: false, error: "Organización inválida" };
  if (!z.string().uuid().safeParse(invitationId).success) return { ok: false, error: "Invitación inválida" };
  try {
    const { user } = await actorWithRole(orgId);
    const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.organizationId !== orgId || invitation.status !== "pending") {
      return { ok: false, error: "Invitación no encontrada." };
    }
    await cancelInvitation(invitationId, user.id);
    revalidatePath("/dashboard/miembros");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo cancelar la invitación.");
  }
}

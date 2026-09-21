"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformOwner } from "@/lib/auth/guards";
import {
  inviteOrganizationMember,
  updateOrganizationMember,
  removeOrganizationMember,
} from "@/lib/services/organization-members";

type ActionResult = { ok: true } | { ok: false; error: string };

const roleEnum = z.enum(["business_owner", "business_admin", "business_member"]);
const statusEnum = z.enum(["active", "inactive"]);

function fail(e: unknown, fallback: string): ActionResult {
  console.error("[organization-members]", e);
  return { ok: false, error: e instanceof Error ? e.message : fallback };
}

function revalidateOrg(organizationId: string) {
  revalidatePath(`/control/negocios/${organizationId}`);
  revalidatePath("/control/negocios");
  revalidatePath("/control");
}

export async function inviteOrganizationMemberAction(
  organizationId: string,
  input: { email: string; role: "business_owner" | "business_admin" | "business_member" }
): Promise<ActionResult> {
  const actor = await requirePlatformOwner();
  const parsed = z
    .object({ organizationId: z.string().uuid(), email: z.string().email("Email inválido"), role: roleEnum })
    .safeParse({ organizationId, ...input });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await inviteOrganizationMember(parsed.data.organizationId, parsed.data, actor.id);
    revalidateOrg(parsed.data.organizationId);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo invitar.");
  }
}

export async function updateOrganizationMemberAction(
  memberId: string,
  input: {
    role?: "business_owner" | "business_admin" | "business_member";
    status?: "active" | "inactive";
  }
): Promise<ActionResult> {
  const actor = await requirePlatformOwner();
  const parsed = z
    .object({ memberId: z.string().uuid(), role: roleEnum.optional(), status: statusEnum.optional() })
    .safeParse({ memberId, ...input });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    const updated = await updateOrganizationMember(
      parsed.data.memberId,
      { role: parsed.data.role, status: parsed.data.status },
      actor.id
    );
    revalidateOrg(updated.organizationId);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo actualizar el miembro.");
  }
}

export async function removeOrganizationMemberAction(memberId: string): Promise<ActionResult> {
  const actor = await requirePlatformOwner();
  if (!z.string().uuid().safeParse(memberId).success) {
    return { ok: false, error: "Miembro inválido" };
  }
  try {
    const { prisma } = await import("@/lib/prisma");
    const target = await prisma.organizationMember.findUnique({ where: { id: memberId } });
    await removeOrganizationMember(memberId, actor.id);
    if (target) revalidateOrg(target.organizationId);
    else revalidatePath("/control");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo dar de baja al miembro.");
  }
}

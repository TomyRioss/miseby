"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/auth/guards";
import { createMembership, updateMembership } from "@/lib/services/memberships";
import { membershipSchema, membershipUpdateSchema } from "@/lib/validations/mise";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createMembershipAction(input: unknown): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  const parsed = membershipSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    const { organizationId, planId, status, source, internalNotes } = parsed.data;
    await createMembership(
      {
        organizationId,
        planId,
        status,
        source,
        startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        trialEndsAt: parsed.data.trialEndsAt ? new Date(parsed.data.trialEndsAt) : undefined,
        internalNotes,
      },
      user.id
    );
    revalidatePath(`/control/negocios/${organizationId}`);
    revalidatePath("/control/membresias");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al crear membresía" };
  }
}

export async function updateMembershipAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  const parsed = membershipUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await updateMembership(
      id,
      {
        ...parsed.data,
        startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        trialEndsAt: parsed.data.trialEndsAt ? new Date(parsed.data.trialEndsAt) : undefined,
      },
      user.id
    );
    revalidatePath("/control/membresias");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al actualizar membresía" };
  }
}

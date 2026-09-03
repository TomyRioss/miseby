"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/auth/guards";
import {
  createInvitation,
  resendInvitation,
  cancelInvitation,
  acceptInvitation,
} from "@/lib/services/invitations";
import { invitationSchema, acceptInvitationSchema } from "@/lib/validations/mise";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createInvitationAction(input: unknown): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await createInvitation(parsed.data, user.id);
    revalidatePath("/control/invitaciones");
    revalidatePath(`/control/negocios/${parsed.data.organizationId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al invitar" };
  }
}

export async function resendInvitationAction(id: string): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  try {
    await resendInvitation(id, user.id);
    revalidatePath("/control/invitaciones");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al reenviar" };
  }
}

export async function cancelInvitationAction(id: string): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  try {
    await cancelInvitation(id, user.id);
    revalidatePath("/control/invitaciones");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al cancelar" };
  }
}

export async function acceptInvitationAction(input: unknown): Promise<ActionResult> {
  const parsed = acceptInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await acceptInvitation(parsed.data.token, parsed.data.password, parsed.data.name);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al aceptar invitación" };
  }
}

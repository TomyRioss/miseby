"use server";

import { publicError } from "@/lib/security/public-error";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/auth/guards";
import {
  createInvitation,
  resendInvitation,
  cancelInvitation,
  acceptInvitation,
} from "@/lib/services/invitations";
import { invitationSchema, acceptInvitationSchema } from "@/lib/validations/mise";
import { getCurrentUser } from "@/lib/auth/session";
import { allowRequest } from "@/lib/security/rate-limit";

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
    return { ok: false, error: publicError(error, "Error al invitar") };
  }
}

export async function resendInvitationAction(id: string): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  try {
    await resendInvitation(id, user.id);
    revalidatePath("/control/invitaciones");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: publicError(error, "Error al reenviar") };
  }
}

export async function cancelInvitationAction(id: string): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  try {
    await cancelInvitation(id, user.id);
    revalidatePath("/control/invitaciones");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: publicError(error, "Error al cancelar") };
  }
}

export async function acceptInvitationAction(input: unknown): Promise<ActionResult> {
  const parsed = acceptInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    if (!(await allowRequest("invite-accept-global", "all", 100, 60)) ||
        !(await allowRequest("invite-accept-token", parsed.data.token, 5, 900))) {
      return { ok: false, error: "Demasiados intentos. Esperá unos minutos." };
    }
    const currentUser = await getCurrentUser();
    await acceptInvitation(parsed.data.token, parsed.data.password, parsed.data.name, currentUser?.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: publicError(error, "Error al aceptar invitación") };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/auth/guards";
import {
  createOrganization,
  updateOrganization,
  setOrganizationStatus,
} from "@/lib/services/organizations";
import { organizationSchema, organizationStatusSchema } from "@/lib/validations/mise";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createOrganizationAction(input: unknown): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await createOrganization(parsed.data, user.id);
    revalidatePath("/control/negocios");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al crear negocio" };
  }
}

export async function updateOrganizationAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  const parsed = organizationSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await updateOrganization(id, parsed.data, user.id);
    revalidatePath(`/control/negocios/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al actualizar" };
  }
}

export async function setOrganizationStatusAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await requirePlatformOwner();
  const parsed = organizationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await setOrganizationStatus(id, parsed.data.status, user.id);
    revalidatePath(`/control/negocios/${id}`);
    revalidatePath("/control/negocios");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al cambiar estado" };
  }
}

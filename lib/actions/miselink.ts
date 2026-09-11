"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessUser } from "@/lib/auth/guards";
import * as service from "@/lib/services/miselink";
import {
  usernameSchema,
  profileSchema,
  linkItemSchema,
  socialSchema,
  reorderSchema,
  themeSchema,
} from "@/lib/validations/miselink";

type ActionResult = { ok: true } | { ok: false; error: string };

const EDITOR_PATH = "/dashboard/miselink";

function fail(error: unknown, fallback: string): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : fallback;
  console.error("[miselink]", error);
  return { ok: false, error: message };
}

async function revalidateFor(userId: string) {
  revalidatePath(EDITOR_PATH);
  try {
    const page = await service.getOrCreateMiseLinkPage(userId);
    if (page.published) revalidatePath(`/${page.username}`);
  } catch {
    /* noop: revalidación best-effort */
  }
}

export async function updateUsernameAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = usernameSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Nombre inválido" };
    }
    await service.updateUsername(user.id, parsed.data);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo actualizar el nombre.");
  }
}

export async function checkUsernameAction(
  input: unknown,
): Promise<{ ok: true; available: boolean } | { ok: false; error: string }> {
  try {
    const user = await requireBusinessUser();
    const parsed = usernameSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Nombre inválido" };
    }
    const available = await service.isUsernameAvailable(user.id, parsed.data);
    return { ok: true, available };
  } catch (e) {
    return fail(e, "No se pudo verificar el nombre.");
  }
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    await service.updateProfile(user.id, parsed.data);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo actualizar el perfil.");
  }
}

export async function updateThemeAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = themeSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Diseño inválido" };
    }
    await service.updateTheme(user.id, parsed.data as Record<string, unknown>);
    await revalidateFor(user.id);
    revalidatePath("/dashboard/miselink/design");
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo guardar el diseño.");
  }
}

export async function setPublishedAction(published: boolean): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    await service.setPublished(user.id, published);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo cambiar el estado de publicación.");
  }
}

export async function createLinkAction(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  try {
    const user = await requireBusinessUser();
    const parsed = linkItemSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const id = await service.createLink(user.id, parsed.data);
    await revalidateFor(user.id);
    return { ok: true, id };
  } catch (e) {
    return fail(e, "No se pudo crear el enlace.");
  }
}

export async function updateLinkAction(
  itemId: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = linkItemSchema.partial().safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    await service.updateLink(user.id, itemId, parsed.data);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo actualizar el enlace.");
  }
}

export async function deleteLinkAction(itemId: string): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    await service.deleteLink(user.id, itemId);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo eliminar el enlace.");
  }
}

export async function reorderLinksAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    await service.reorderLinks(user.id, parsed.data.ids);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo reordenar.");
  }
}

export async function createSocialAction(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  try {
    const user = await requireBusinessUser();
    const parsed = socialSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const id = await service.createSocial(user.id, parsed.data);
    await revalidateFor(user.id);
    return { ok: true, id };
  } catch (e) {
    return fail(e, "No se pudo agregar la red social.");
  }
}

export async function deleteSocialAction(socialId: string): Promise<ActionResult> {
  try {
    const user = await requireBusinessUser();
    await service.deleteSocial(user.id, socialId);
    await revalidateFor(user.id);
    return { ok: true };
  } catch (e) {
    return fail(e, "No se pudo eliminar la red social.");
  }
}

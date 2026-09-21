"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/auth/guards";
import { setUserStatus, deleteUser } from "@/lib/services/users";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function setUserStatusAction(
  userId: string,
  input: { status: "active" | "suspended" }
): Promise<ActionResult> {
  const actor = await requirePlatformOwner();
  if (input.status !== "active" && input.status !== "suspended") {
    return { ok: false, error: "Estado inválido" };
  }
  if (userId === actor.id) {
    return { ok: false, error: "No podés cambiar tu propio estado." };
  }
  try {
    await setUserStatus(userId, input.status);
    revalidatePath("/control/usuarios");
    revalidatePath("/control");
    return { ok: true };
  } catch (error) {
    console.error("[setUserStatusAction]", error);
    return { ok: false, error: error instanceof Error ? error.message : "Error al cambiar estado" };
  }
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const actor = await requirePlatformOwner();
  if (userId === actor.id) {
    return { ok: false, error: "No podés eliminar tu propia cuenta." };
  }
  try {
    await deleteUser(userId);
    revalidatePath("/control/usuarios");
    revalidatePath("/control");
    return { ok: true };
  } catch (error) {
    console.error("[deleteUserAction]", error);
    return { ok: false, error: error instanceof Error ? error.message : "Error al eliminar usuario" };
  }
}

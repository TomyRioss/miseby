"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import {
  updateEmailSchema,
  updateProfileNameSchema,
} from "@/lib/validations/account";

export type AccountActionResult =
  | { ok: true; requireRelogin?: boolean }
  | { ok: false; error: string };

// NOTA rate-limit: no existe helper de throttle en lib/ (TOM-203).
// Si el abuso se vuelve un problema, agregar throttle por userId acá
// (p. ej. max 10 cambios/hora) y/o debounce en el FE.

export async function updateProfileNameAction(
  input: unknown
): Promise<AccountActionResult> {
  const user = await requireUser();
  const parsed = updateProfileNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
    });
    // Sin audit log: el enum AuditAction no tiene evento de perfil
    // y no se puede migrar (TOM-203).
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el nombre" };
  }
}

export async function updateEmailAction(
  input: unknown
): Promise<AccountActionResult> {
  const user = await requireUser();
  const parsed = updateEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const newEmail = parsed.data.email;
  try {
    const profile = await prisma.userProfile.findUniqueOrThrow({
      where: { id: user.id },
    });

    const isValid = await bcrypt.compare(
      parsed.data.currentPassword,
      profile.passwordHash
    );
    if (!isValid) {
      return { ok: false, error: "Contraseña actual incorrecta" };
    }

    if (newEmail === profile.email) {
      return { ok: false, error: "Ese ya es tu email actual" };
    }

    // Unicidad con error genérico: no revelar si el email está en uso.
    const existing = await prisma.userProfile.findUnique({
      where: { email: newEmail },
    });
    if (existing) {
      return { ok: false, error: "No se pudo actualizar el email. Intentá con otro." };
    }

    await prisma.userProfile.update({
      where: { id: user.id },
      data: { email: newEmail },
    });
    // Sin audit log: el enum AuditAction no tiene evento de email
    // y no se puede migrar (TOM-203).
    // El JWT de la sesión queda con el mail viejo → el FE debe forzar relogin.
    return { ok: true, requireRelogin: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el email" };
  }
}

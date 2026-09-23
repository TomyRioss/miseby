"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import {
  registerBusinessOwner,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
} from "@/lib/services/auth";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validations/auth";
import { requireUser } from "@/lib/auth/guards";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function loginAction(email: string, password: string): Promise<ActionResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { ok: false, error: "Ingresá tu email y contraseña para continuar." };
  }
  try {
    await signIn("credentials", { email: cleanEmail, password, redirect: false });
    return { ok: true };
  } catch (error) {
    console.error("[auth] login", error);
    if (error instanceof AuthError) {
      const cause =
        ((error.cause as unknown as { err?: { message?: string } })?.err?.message ??
          (error.cause as unknown as Error | null)?.message ??
          error.message ??
          "") as string;
      if (/suspend/i.test(cause)) {
        return { ok: false, error: "Tu cuenta fue suspendida. Escribinos a soporte para revisarla." };
      }
      if (error.type === "CredentialsSignin" || /credential|password|user|email|not found|invalid/i.test(cause)) {
        return { ok: false, error: "Email o contraseña incorrectos. Revisá los datos e intentá de nuevo." };
      }
      return { ok: false, error: "Email o contraseña incorrectos. Revisá los datos e intentá de nuevo." };
    }
    if (error instanceof Error && /fetch|network|prisma|connect|timeout/i.test(error.message)) {
      return { ok: false, error: "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo." };
    }
    return { ok: false, error: "Ocurrió un error al iniciar sesión. Intentá de nuevo en unos segundos." };
  }
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await registerBusinessOwner(parsed.data);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al registrar" };
  }
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await requestPasswordReset(parsed.data.email);
    return { ok: true };
  } catch {
    return { ok: false, error: "Error al solicitar recuperación" };
  }
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await confirmPasswordReset(parsed.data.token, parsed.data.password);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Token inválido" };
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error al cambiar contraseña" };
  }
}

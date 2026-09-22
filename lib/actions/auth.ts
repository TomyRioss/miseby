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
import { prisma } from "@/lib/prisma";
import { getOnboardingStatus } from "@/lib/services/onboarding";

type ActionResult = { ok: true } | { ok: false; error: string };
type LoginResult = { ok: true; redirect: string } | { ok: false; error: string };

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      const cause =
        ((error.cause as unknown as { err?: { message?: string } })?.err?.message ??
          (error.cause as unknown as Error | null)?.message ??
          error.message ??
          "") as string;
      if (/suspend/i.test(cause)) {
        return { ok: false, error: "Tu cuenta fue suspendida. Contactá a soporte." };
      }
      return { ok: false, error: "Email o contraseña incorrectos" };
    }
    return { ok: false, error: "Error al iniciar sesión" };
  }
  // Destino post-login: preserva el gate de onboarding sin pasar por /onboarding
  // cuando el usuario ya lo completó (misma regla que app/(business)/onboarding/page.tsx).
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, role: true },
    });
    if (!profile) return { ok: true, redirect: "/dashboard" };
    if (profile.role === "platform_owner") return { ok: true, redirect: "/control" };
    const status = await getOnboardingStatus(profile.id);
    return { ok: true, redirect: status.completed ? "/dashboard" : "/onboarding" };
  } catch {
    return { ok: true, redirect: "/dashboard" };
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

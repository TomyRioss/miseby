"use server";

import { publicError } from "@/lib/security/public-error";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import {
  registerBusinessOwner,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
  confirmEmailVerification,
  resendVerificationEmail,
} from "@/lib/services/auth";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  loginSchema,
  securityTokenSchema,
} from "@/lib/validations/auth";
import { requireUser } from "@/lib/auth/guards";
import { allowRequest } from "@/lib/security/rate-limit";

const TOO_MANY_ATTEMPTS = "Demasiados intentos. Esperá unos minutos.";

async function allowAuthAction(scope: string, key: string, points = 5) {
  return await allowRequest(`${scope}-global`, "all", 100, 60) &&
    await allowRequest(scope, key, points, 900);
}

type ActionResult = { ok: true; code?: "verify_email" } | { ok: false; error: string; code?: "email_unverified" };

export async function loginAction(email: string, password: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { ok: false, error: "Ingresá tu email y contraseña para continuar." };
  }
  const cleanEmail = parsed.data.email;
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
      if (/EMAIL_UNVERIFIED/.test(cause)) {
        return {
          ok: false,
          error: "Tu cuenta aún no está verificada. Revisá tu email para activarla.",
          code: "email_unverified",
        };
      }
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
    if (!(await allowAuthAction("register", parsed.data.email, 3))) return { ok: false, error: TOO_MANY_ATTEMPTS };
    await registerBusinessOwner(parsed.data);
    return { ok: true, code: "verify_email" as const };
  } catch (error) {
    return { ok: false, error: publicError(error, "Error al registrar") };
  }
}

export async function confirmEmailAction(token: string): Promise<ActionResult> {
  if (!securityTokenSchema.safeParse(token).success) return { ok: false, error: "Token inválido" };
  try {
    if (!(await allowAuthAction("verify-email", token))) return { ok: false, error: TOO_MANY_ATTEMPTS };
    await confirmEmailVerification(token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: publicError(error, "Token inválido") };
  }
}

export async function resendVerificationAction(email: string): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return { ok: false, error: "Ingresá un email válido." };
  const clean = parsed.data.email;
  try {
    if (!(await allowAuthAction("resend-verification", clean, 3))) return { ok: false, error: TOO_MANY_ATTEMPTS };
    await resendVerificationEmail(clean);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo reenviar. Probá de nuevo." };
  }
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    if (!(await allowAuthAction("forgot-password", parsed.data.email, 3))) return { ok: false, error: TOO_MANY_ATTEMPTS };
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
    if (!(await allowAuthAction("reset-password", parsed.data.token))) return { ok: false, error: TOO_MANY_ATTEMPTS };
    await confirmPasswordReset(parsed.data.token, parsed.data.password);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: publicError(error, "Token inválido") };
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    if (!(await allowAuthAction("change-password", user.id))) return { ok: false, error: TOO_MANY_ATTEMPTS };
    await changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: publicError(error, "Error al cambiar contraseña") };
  }
}

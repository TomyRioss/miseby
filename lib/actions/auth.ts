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
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/guards";
import {
  checkThrottle,
  recordFailure,
  recordSuccess,
  formatRetryAfter,
  LOGIN_THROTTLE,
  LOGIN_IP_THROTTLE,
  REGISTER_THROTTLE,
  FORGOT_THROTTLE,
  FORGOT_IP_THROTTLE,
} from "@/lib/auth/rate-limit";

type ActionResult = { ok: true } | { ok: false; error: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip")?.trim() || "unknown";
}

const THROTTLED_MSG =
  "Demasiados intentos. Por seguridad tu acceso se bloqueó temporalmente.";

function throttledError(retryAfterSec: number): string {
  return `${THROTTLED_MSG} ${formatRetryAfter(retryAfterSec)}.`;
}

export async function loginAction(email: string, password: string): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase();
  const ip = await clientIp();
  // Clave por email+IP y tope agregado por IP (frena barridos que rotan email).
  // El chequeo previo al signIn cuenta incluso emails inexistentes: no revela si
  // el email existe y el mensaje de bloqueo es idéntico en todos los casos.
  const key = `login:${normalized}:${ip}`;
  const ipKey = `login-ip:${ip}`;
  const hit = checkThrottle(key, LOGIN_THROTTLE);
  if (hit.blocked) {
    return { ok: false, error: throttledError(hit.retryAfterSec) };
  }
  const ipHit = checkThrottle(ipKey, LOGIN_IP_THROTTLE);
  if (ipHit.blocked) {
    return { ok: false, error: throttledError(ipHit.retryAfterSec) };
  }
  try {
    await signIn("credentials", { email, password, redirect: false });
    recordSuccess(key);
    recordSuccess(ipKey);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      const fail = recordFailure(key, LOGIN_THROTTLE);
      recordFailure(ipKey, LOGIN_IP_THROTTLE);
      if (fail.retryAfterSec > 0) {
        return { ok: false, error: throttledError(fail.retryAfterSec) };
      }
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
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const ip = await clientIp();
  const key = `register:${ip}`;
  const hit = checkThrottle(key, REGISTER_THROTTLE);
  if (hit.blocked) {
    return { ok: false, error: throttledError(hit.retryAfterSec) };
  }
  try {
    await registerBusinessOwner(parsed.data);
    recordSuccess(key);
    return { ok: true };
  } catch (error) {
    recordFailure(key, REGISTER_THROTTLE);
    return { ok: false, error: error instanceof Error ? error.message : "Error al registrar" };
  }
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const ip = await clientIp();
  const key = `forgot:${parsed.data.email.trim().toLowerCase()}:${ip}`;
  const ipKey = `forgot-ip:${ip}`;
  // Bloqueado o no, la respuesta es siempre ok:true para no revelar si el
  // email existe; si hay throttle simplemente no se reenvía el correo.
  if (checkThrottle(key, FORGOT_THROTTLE).blocked || checkThrottle(ipKey, FORGOT_IP_THROTTLE).blocked) {
    return { ok: true };
  }
  try {
    await requestPasswordReset(parsed.data.email);
    recordSuccess(key);
    recordSuccess(ipKey);
    return { ok: true };
  } catch {
    recordFailure(key, FORGOT_THROTTLE);
    recordFailure(ipKey, FORGOT_IP_THROTTLE);
    return { ok: true };
  }
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  // Throttle por IP (el token rota por intento, así que solo el tope agregado sirve).
  const ip = await clientIp();
  const ipKey = `forgot-ip:${ip}`;
  if (checkThrottle(ipKey, FORGOT_IP_THROTTLE).blocked) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo más tarde." };
  }
  try {
    await confirmPasswordReset(parsed.data.token, parsed.data.password);
    recordSuccess(ipKey);
    return { ok: true };
  } catch (error) {
    recordFailure(ipKey, FORGOT_IP_THROTTLE);
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

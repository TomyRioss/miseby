// Throttle en memoria para server actions (login, register, forgot-password).
// Sin dependencias ni tablas: Map<key, Entry> con timestamps y limpieza lazy.
// Pensado para single-instance; no es un límite exacto distribuido.

export type ThrottleParams = {
  /** Fallos tolerados dentro de la ventana antes de bloquear. */
  maxAttempts: number;
  /** Ventana deslizante en ms donde se cuentan los fallos. */
  windowMs: number;
  /** Bloqueo inicial en ms al agotar los intentos. */
  baseLockoutMs: number;
  /** Tope del bloqueo con backoff en ms. */
  maxLockoutMs: number;
};

type Entry = {
  failures: number;
  windowStart: number;
  lockedUntil: number;
};

const store = new Map<string, Entry>();

const SWEEP_EVERY_MS = 5 * 60_000;
let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_EVERY_MS && store.size < 10_000) return;
  lastSweep = now;
  for (const [key, entry] of store) {
    if (now >= entry.lockedUntil && now - entry.windowStart > 60 * 60_000) {
      store.delete(key);
    }
  }
}

/** Parámetros por acción. */
export const LOGIN_THROTTLE: ThrottleParams = {
  maxAttempts: 5,
  windowMs: 10 * 60_000,
  baseLockoutMs: 60_000,
  maxLockoutMs: 30 * 60_000,
};

/** Tope agregado por IP: frena barridos que rotan el email. */
export const LOGIN_IP_THROTTLE: ThrottleParams = {
  maxAttempts: 20,
  windowMs: 10 * 60_000,
  baseLockoutMs: 5 * 60_000,
  maxLockoutMs: 30 * 60_000,
};

export const REGISTER_THROTTLE: ThrottleParams = {
  maxAttempts: 10,
  windowMs: 60 * 60_000,
  baseLockoutMs: 5 * 60_000,
  maxLockoutMs: 30 * 60_000,
};

export const FORGOT_THROTTLE: ThrottleParams = {
  maxAttempts: 5,
  windowMs: 15 * 60_000,
  baseLockoutMs: 2 * 60_000,
  maxLockoutMs: 30 * 60_000,
};

function getFresh(key: string, params: ThrottleParams, now: number): Entry | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  // Ventana vencida y sin bloqueo activo: se resetea.
  if (now - entry.windowStart > params.windowMs && now >= entry.lockedUntil) {
    store.delete(key);
    return undefined;
  }
  return entry;
}

/** ¿La clave está bloqueada? No muta contadores. */
export function checkThrottle(
  key: string,
  params: ThrottleParams,
  now: number = Date.now(),
): { blocked: boolean; retryAfterSec: number } {
  sweep(now);
  const entry = getFresh(key, params, now);
  if (entry && now < entry.lockedUntil) {
    return { blocked: true, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  return { blocked: false, retryAfterSec: 0 };
}

function lockoutFor(overflow: number, params: ThrottleParams): number {
  return Math.min(params.baseLockoutMs * 2 ** overflow, params.maxLockoutMs);
}

/** Registra un fallo; al agotar intentos impone bloqueo con backoff creciente. */
export function recordFailure(
  key: string,
  params: ThrottleParams,
  now: number = Date.now(),
): { retryAfterSec: number } {
  sweep(now);
  let entry = getFresh(key, params, now);
  if (!entry) {
    entry = { failures: 0, windowStart: now, lockedUntil: 0 };
    store.set(key, entry);
  }
  entry.failures += 1;
  if (entry.failures >= params.maxAttempts) {
    const overflow = entry.failures - params.maxAttempts;
    entry.lockedUntil = now + lockoutFor(overflow, params);
    return { retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  return { retryAfterSec: 0 };
}

/** Éxito: limpia el contador de la clave. */
export function recordSuccess(key: string): void {
  store.delete(key);
}

/** "Probá de nuevo en 90 segundos" / "...en 3 minutos". */
export function formatRetryAfter(retryAfterSec: number): string {
  if (retryAfterSec >= 60) {
    const min = Math.ceil(retryAfterSec / 60);
    return `Probá de nuevo en ${min} minuto${min === 1 ? "" : "s"}`;
  }
  return `Probá de nuevo en ${retryAfterSec} segundo${retryAfterSec === 1 ? "" : "s"}`;
}

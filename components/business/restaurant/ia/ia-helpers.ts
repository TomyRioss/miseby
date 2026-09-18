"use client";

export const FOCUS_LIMIT = 600;
export const TONE_LIMIT = 1000;
export const CHAT_LIMIT = 300;

export const QUICK_SUGGESTIONS = [
  "¿Qué me recomendás liviano?",
  "¿Qué postre pido?",
  "Somos 2, ¿qué pedimos?",
] as const;

export const FOCUS_EXAMPLES = [
  "Menú del día + postres de la casa",
  "Empanadas y pizzas para compartir",
  "Platos sin gluten y ensaladas",
] as const;

export const TONE_EXAMPLES = [
  "Cercano y breve, 2 líneas máx.",
  "Familiar argentino, con humor tranqui",
  "Formal y directo, sin emojis",
] as const;

export type ChatMsg = { role: "user" | "ia"; text: string; at: number };

export function buildPrompt(menuSummary: string, focus: string, tone: string) {
  return `Mesero IA · solo platos reales (${menuSummary}). Foco: ${focus.trim() || "todo el menú"}. Tono: ${tone.trim() || "amable, español, breve"}.`;
}

export function timeAgo(ts: number | null) {
  if (!ts) return null;
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "ahora mismo";
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.floor(m / 60)} h`;
}

/** Vista previa local — no toca el backend. La respuesta real la genera la IA. */
export function fakeReply(q: string, menu: string, focus: string) {
  const s = q.toLowerCase();
  const dishes = menu || "nuestros destacados";
  if (s.includes("liviano") || s.includes("light") || s.includes("ensalada") || s.includes("dieta"))
    return `Liviano y rico: ${dishes}.${focus ? ` Hoy te impulso: ${focus}.` : ""} ¿Te armo algo sin fritura?`;
  if (s.includes("precio") || s.includes("barato") || s.includes("promo") || s.includes("somos 2") || s.includes("qué pedimos"))
    return `Para 2, lo que más conviene: ${dishes}. Pidan variado y comparten.`;
  if (s.includes("postre") || s.includes("dulce")) return `De postre, lo de la casa: mirá la sección Postres. ${dishes}.`;
  return `Con gusto. Hoy sale mucho: ${dishes}. ¿Antojo contundente o liviano?`;
}

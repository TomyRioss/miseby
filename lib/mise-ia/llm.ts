import type { RestaurantCategory, RestaurantProduct } from "@/lib/restaurant-theme";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Modelo del mesero. Overridable con MISE_IA_MODEL. */
export const MISE_IA_MODEL = process.env.MISE_IA_MODEL ?? "xiaomi/mimo-v2.5";

export type LlmHistoryMsg = { role: "user" | "ia"; text: string };

export type MeseroContext = {
  message: string;
  history: LlmHistoryMsg[];
  products: RestaurantProduct[];
  categories: RestaurantCategory[];
  businessName: string;
  hours: string;
  whatsapp: string;
  focus: string;
  tone: string;
};

function price(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

/** Carta real como texto para groundear al modelo. Solo disponibles, tope 40. */
export function buildMenuContext(
  products: RestaurantProduct[],
  categories: RestaurantCategory[]
): string {
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  return products
    .filter((p) => p.available)
    .slice(0, 40)
    .map((p) => {
      const cat = catName.get(p.categoryId) ?? "Carta";
      const desc = p.description?.trim() ? ` — ${p.description.trim().slice(0, 80)}` : "";
      return `• ${p.name} (${cat}) — ${price(p.price)}${desc}`;
    })
    .join("\n");
}

/**
 * Respuesta del mesero vía OpenRouter. Devuelve null si no hay key
 * o si el proveedor falla (el caller usa el reply determinístico).
 */
export async function getMeseroReply(ctx: MeseroContext): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;
  const menu = buildMenuContext(ctx.products, ctx.categories);
  if (!menu) return null;

  const system = [
    `Sos el mesero de "${ctx.businessName || "nuestro local"}" (Argentina). Respondés breve, cálido, en español rioplatense (2-4 líneas).`,
    `Solo podés recomendar platos de ESTA carta (usá los nombres exactos). Si piden algo que no está, ofrecé lo más parecido de la carta sin inventar.`,
    ctx.focus.trim() ? `Foco del local: ${ctx.focus.trim()}.` : "",
    ctx.tone.trim() ? `Tono: ${ctx.tone.trim()}.` : "",
    `Horarios: ${ctx.hours || "consultar"}${ctx.whatsapp ? ` · WhatsApp: ${ctx.whatsapp}` : ""}.`,
    `CARTA:\n${menu}`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages = [
    { role: "system", content: system },
    ...ctx.history.slice(-8).map((h) => ({
      role: h.role === "ia" ? "assistant" : "user",
      content: h.text,
    })),
    { role: "user", content: ctx.message },
  ];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://miseby.app",
        "X-Title": "Miseby Mise IA",
      },
      body: JSON.stringify({
        model: MISE_IA_MODEL,
        temperature: 0.7,
        max_tokens: 800,
        messages,
      }),
    });
    if (!res.ok) {
      console.error("[mise-ia llm] http", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = await res.json().catch(() => null);
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text ? text.slice(0, 1200) : null;
  } catch (e) {
    console.error("[mise-ia llm]", e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

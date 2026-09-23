import type { RestaurantCategory, RestaurantProduct } from "@/lib/restaurant-theme";
import fs from "node:fs";
import path from "node:path";
import tls from "node:tls";
import { Agent, request } from "undici";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Modelo del mesero. Overridable con MISE_IA_MODEL. */
export const MISE_IA_MODEL = process.env.MISE_IA_MODEL ?? "xiaomi/mimo-v2.5";

type ChatCompletion = { choices?: Array<{ message?: { content?: unknown } }> };

let cachedDispatcher: Agent | undefined;
let dispatcherResolved = false;

/**
 * Dispatcher con el CA raíz del antivirus local agregado. Algunos antivirus
 * (p. ej. Kaspersky) interceptan el TLS firmando con un root propio que Node
 * no trae, y el fetch a OpenRouter muere con "self-signed certificate in
 * certificate chain". El PEM de certs/kaspersky-root.pem se SUMA a los CA
 * estándar: sin ese archivo (prod / otras máquinas) todo sigue como antes.
 */
function getDispatcher(): Agent | undefined {
  if (dispatcherResolved) return cachedDispatcher;
  dispatcherResolved = true;
  try {
    const extraCa = fs.readFileSync(path.join(process.cwd(), "certs", "kaspersky-root.pem"), "utf8");
    cachedDispatcher = new Agent({ connect: { ca: [...tls.rootCertificates, extraCa] } });
  } catch {
    cachedDispatcher = undefined;
  }
  return cachedDispatcher;
}

export type LlmReason =
  | "ok"
  | "no_key"
  | "empty_menu"
  | "http"
  | "tls"
  | "timeout"
  | "empty_content"
  | "error";

export type MeseroResult = { text: string | null; reason: LlmReason; httpStatus?: number };

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
 * Respuesta del mesero vía OpenRouter. Nunca lanza: si el proveedor falla,
 * `text` es null y `reason` explica por qué (el caller usa el determinístico).
 * Sin timeout agresivo: mimo razona y puede tardar; red de 120s solamente.
 */
export async function getMeseroReply(ctx: MeseroContext): Promise<MeseroResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[mise-ia llm] sin OPENROUTER_API_KEY en el server");
    return { text: null, reason: "no_key" };
  }
  const menu = buildMenuContext(ctx.products, ctx.categories);
  const menuBlock = menu
    ? `CARTA:\n${menu}`
    : `CARTA: aún en construcción (sin platos cargados). No inventes ningún plato: respondé como mesero igual (saludos, info del local, horarios), con calidez, e invitá a descubrir la carta cuando esté lista.`;

  const system = [
    `Sos el mesero de "${ctx.businessName || "nuestro local"}" (Argentina). Respondés breve, cálido, en español rioplatense (2-4 líneas).`,
    `Solo podés recomendar platos de ESTA carta (usá los nombres exactos). Si piden algo que no está, ofrecé lo más parecido de la carta sin inventar.`,
    ctx.focus.trim() ? `Foco del local: ${ctx.focus.trim()}.` : "",
    ctx.tone.trim() ? `Tono: ${ctx.tone.trim()}.` : "",
    `Horarios: ${ctx.hours || "consultar"}${ctx.whatsapp ? ` · WhatsApp: ${ctx.whatsapp}` : ""}.`,
    menuBlock,
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

  try {
    const res = await request(OPENROUTER_URL, {
      method: "POST",
      dispatcher: getDispatcher(),
      headersTimeout: 115_000,
      bodyTimeout: 20_000,
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
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.error("[mise-ia llm] mesero http", res.statusCode, (await res.body.text()).slice(0, 200));
      return { text: null, reason: "http", httpStatus: res.statusCode };
    }
    const data = (await res.body.json().catch(() => null)) as ChatCompletion | null;
    const raw = data?.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) {
      console.error("[mise-ia llm] respuesta sin contenido", JSON.stringify(data)?.slice(0, 300));
      return { text: null, reason: "empty_content" };
    }
    return { text: text.slice(0, 1200), reason: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const causeMsg = e instanceof Error ? String((e as { cause?: unknown }).cause ?? "") : "";
    const tlsErr = /certificate|self-signed|SELF_SIGNED/i.test(`${msg} ${causeMsg}`);
    const timeout = /timeout|timed out/i.test(`${e instanceof Error ? e.name : ""} ${msg} ${causeMsg}`);
    console.error("[mise-ia llm] mesero", timeout ? "timeout 120s" : msg, "cause:", causeMsg);
    return { text: null, reason: timeout ? "timeout" : tlsErr ? "tls" : "error" };
  }
}

/** Descripción corta de producto/plato (≤240 caracteres) con Mise IA. */
export async function generateProductDescription(input: {
  name: string;
  itemWord?: string;
  businessName?: string;
}): Promise<MeseroResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[mise-ia llm] sin OPENROUTER_API_KEY en el server");
    return { text: null, reason: "no_key" };
  }
  const item = (input.itemWord || "producto").toLowerCase();
  const system = [
    `Escribís descripciones cortas para el ${item} de un local en Argentina, en español rioplatense, una sola línea, máximo 200 caracteres.`,
    `Sin hashtags, sin emojis, sin comillas. Solo la descripción, nada más.`,
    input.businessName ? `Local: ${input.businessName}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const res = await request(OPENROUTER_URL, {
      method: "POST",
      dispatcher: getDispatcher(),
      headersTimeout: 55_000,
      bodyTimeout: 20_000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://miseby.app",
        "X-Title": "Miseby Mise IA",
      },
      body: JSON.stringify({
        model: MISE_IA_MODEL,
        temperature: 0.8,
        max_tokens: 150,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Descripción para: ${input.name}` },
        ],
      }),
    });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.error("[mise-ia llm] describe http", res.statusCode, (await res.body.text()).slice(0, 200));
      return { text: null, reason: "http", httpStatus: res.statusCode };
    }
    const data = (await res.body.json().catch(() => null)) as ChatCompletion | null;
    const raw = data?.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) {
      console.error("[mise-ia llm] respuesta sin contenido", JSON.stringify(data)?.slice(0, 300));
      return { text: null, reason: "empty_content" };
    }
    return { text: text.replace(/\s+/g, " ").slice(0, 240), reason: "ok" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const causeMsg = e instanceof Error ? String((e as { cause?: unknown }).cause ?? "") : "";
    const tlsErr = /certificate|self-signed|SELF_SIGNED/i.test(`${msg} ${causeMsg}`);
    const timeout = /timeout|timed out/i.test(`${e instanceof Error ? e.name : ""} ${msg} ${causeMsg}`);
    console.error("[mise-ia llm] describe", timeout ? "timeout 60s" : msg, "cause:", causeMsg);
    return { text: null, reason: timeout ? "timeout" : tlsErr ? "tls" : "error" };
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicMenuBySlug } from "@/lib/services/public-menu";
import { getMeseroReply } from "@/lib/mise-ia/llm";
import { recommendDishes } from "@/lib/mise-ia/recommender";

const ChatSchema = z.object({
  message: z.string().trim().min(1).max(300),
  history: z
    .array(z.object({ role: z.enum(["user", "ia"]), text: z.string().max(300) }))
    .max(8)
    .optional(),
});

/** Rate limit en memoria: 8 msg/min por IP+slug. Suficiente para una instancia; con múltiples instancias usar Redis/Upstash. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 8;

function limited(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length > MAX_HITS;
}

/**
 * Mesero público: el cliente chatea desde la carta con QR, sin login.
 * Respeta el gate de publicado y el toggle isActive del negocio.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const data = await getPublicMenuBySlug(slug);
    if (!data) return NextResponse.json({ ok: false, error: "Menú no disponible" }, { status: 404 });
    const { organization: org, rest } = data;

    if (!rest.ia?.isActive) {
      return NextResponse.json({ ok: false, error: "El mesero no está disponible ahora" }, { status: 403 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (limited(`${ip}:${org.slug}`)) {
      return NextResponse.json(
        { ok: false, error: "Muchos mensajes seguidos, esperá un minuto" },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Mensaje inválido" }, { status: 400 });
    }

    const businessName = rest.appearance?.restaurantName || org.commercialName;
    const result = recommendDishes(parsed.data.message, {
      products: rest.products ?? [],
      categories: rest.categories ?? [],
      focus: rest.ia?.whatToRecommend ?? "",
      tone: rest.ia?.customInstructions ?? "",
      businessName,
    });

    let reply = result.reply;
    let source: "ia" | "local" = "local";
    let detail = "local";
    const llm = await getMeseroReply({
      message: parsed.data.message,
      history: parsed.data.history ?? [],
      products: rest.products ?? [],
      categories: rest.categories ?? [],
      businessName,
      hours: rest.hours ?? "",
      whatsapp: rest.whatsapp ?? "",
      focus: rest.ia?.whatToRecommend ?? "",
      tone: rest.ia?.customInstructions ?? "",
    });
    if (llm.text) {
      reply = llm.text;
      source = "ia";
      detail = "ia";
    } else {
      detail = `local:${llm.reason}`;
    }

    return NextResponse.json({
      ok: true,
      reply,
      source,
      detail,
      dishes: result.dishes.map((d) => ({ ...d, url: `#prod-${d.id}` })),
      business: { name: businessName, hours: rest.hours ?? "", whatsapp: rest.whatsapp ?? "" },
    });
  } catch (e) {
    console.error("[mesero publico]", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getPublicMenuBySlug } from "@/lib/services/public-menu";
import { getPublicCatalogBySlug } from "@/lib/services/catalog";
import { createOrderSchema, updateOrderStatusSchema } from "@/lib/validations/order";
import type { RestaurantProduct } from "@/lib/restaurant-theme";

/** Rate limit en memoria: 30 pedidos/min por IP+slug (mismo patrón que el mesero). */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 30;

function limited(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length > MAX_HITS;
}

type PricedItem = { id: string; name: string; price: number; qty: number };

/**
 * Recomputa el pedido 100% server-side. El id del carrito es
 * `{productId}` o `{productId}|{variantId|base}|{modId,modId}`.
 * Precio/nombre del cliente se IGNORAN: se usan los de la carta vigente.
 * Lanza Error con mensaje mostrable si algo no cierra.
 */
function priceItems(products: RestaurantProduct[], items: { id: string; qty: number }[]): PricedItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((it) => {
    const [productId, variantPart, modsPart] = it.id.split("|");
    const p = byId.get(productId);
    if (!p) throw new Error("Hay productos que ya no existen en la carta. Rearmá el pedido.");
    if (!p.available) throw new Error(`"${p.name}" no está disponible ahora.`);
    let unit = p.price;
    const detail: string[] = [];
    if (variantPart && variantPart !== "base") {
      const v = (p.variants ?? []).find((x) => x.id === variantPart);
      if (!v) throw new Error(`Variante no válida en "${p.name}". Rearmá el pedido.`);
      unit = v.price;
      detail.push(v.name);
    }
    const modIds = modsPart ? modsPart.split(",").filter(Boolean) : [];
    for (const g of p.modifierGroups ?? []) {
      if (g.required && !g.modifiers.some((m) => modIds.includes(m.id))) {
        throw new Error(`Elegí una opción de "${g.name}" en "${p.name}".`);
      }
    }
    const allMods = (p.modifierGroups ?? []).flatMap((g) => g.modifiers);
    const modNames: string[] = [];
    for (const id of modIds) {
      const m = allMods.find((x) => x.id === id);
      if (!m) throw new Error(`Agregado no válido en "${p.name}". Rearmá el pedido.`);
      unit += m.price;
      modNames.push(m.name);
    }
    detail.push(...modNames);
    if (!Number.isInteger(unit) || unit < 0) throw new Error(`Precio inválido en "${p.name}".`);
    return { id: it.id, name: detail.length > 0 ? `${p.name} (${detail.join(" · ")})` : p.name, price: unit, qty: it.qty };
  });
}

/**
 * POST /api/orders — público, SIN auth.
 * Crea un pedido para la org del slug. Acepta slugs de menú y de catálogo
 * (el catálogo es público siempre; el menú mantiene su gate propio).
 * Si ninguno resuelve, 404.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const rawSlug = typeof body?.slug === "string" ? body.slug : "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (rawSlug && limited(`${ip}:${rawSlug.toLowerCase()}`)) {
      return NextResponse.json(
        { ok: false, error: "Muchos pedidos seguidos, esperá un minuto" },
        { status: 429 },
      );
    }

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Pedido inválido" }, { status: 400 });
    }
    const data = parsed.data;

    const menu = await getPublicMenuBySlug(data.slug);
    let organizationId: string | null = menu?.organization.id ?? null;
    let products: RestaurantProduct[] = menu?.rest.products ?? [];
    if (!organizationId) {
      const catalog = await getPublicCatalogBySlug(data.slug);
      if (catalog) {
        const org = await prisma.organization.findUnique({
          where: { slug: catalog.slug },
          select: { id: true },
        });
        organizationId = org?.id ?? null;
        products = catalog.data.products ?? [];
      }
    }
    if (!organizationId) {
      return NextResponse.json({ ok: false, error: "Negocio no disponible" }, { status: 404 });
    }
    const org = { id: organizationId };

    if (!data.customerPhone.trim()) {
      return NextResponse.json({ ok: false, error: "El teléfono es obligatorio" }, { status: 400 });
    }
    if (data.fulfillment === "delivery" && !data.customerAddress?.trim()) {
      return NextResponse.json(
        { ok: false, error: "La dirección es obligatoria para delivery" },
        { status: 400 },
      );
    }

    // Precios 100% server-side: se ignoran price/name del cliente.
    let priced: PricedItem[];
    try {
      priced = priceItems(products, data.items);
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Pedido inválido" },
        { status: 400 },
      );
    }
    const total = priced.reduce((acc, it) => acc + it.price * it.qty, 0);

    const order = await prisma.order.create({
      data: {
        organizationId: org.id,
        items: priced,
        total,
        fulfillment: data.fulfillment,
        payMethod: data.payMethod,
        customerName: data.customerName.trim(),
        customerPhone: data.customerPhone.trim(),
        customerEmail: data.customerEmail?.trim().toLowerCase() || null,
        customerAddress: data.customerAddress?.trim() || null,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: order.id }, { status: 201 });
  } catch (e) {
    console.error("[orders POST]", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

/**
 * GET /api/orders — con auth. Lista pedidos de SU org, createdAt desc, filtro ?status=.
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    const own = await getOrganizationForMember(user.id);
    if (!own?.organization) {
      return NextResponse.json({ ok: false, error: "Sin organización" }, { status: 403 });
    }

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    let status: (typeof updateOrderStatusSchema.shape.status.options)[number] | undefined;
    if (statusParam) {
      const parsed = updateOrderStatusSchema.safeParse({ status: statusParam });
      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
      }
      status = parsed.data.status;
    }

    const orders = await prisma.order.findMany({
      where: {
        organizationId: own.organization.id,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, orders });
  } catch (e) {
    console.error("[orders GET]", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

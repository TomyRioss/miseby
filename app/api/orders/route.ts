import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getPublicMenuBySlug } from "@/lib/services/public-menu";
import { getPublicCatalogBySlug } from "@/lib/services/catalog";
import { createOrderSchema, updateOrderStatusSchema } from "@/lib/validations/order";
import type { RestaurantProduct } from "@/lib/restaurant-theme";
import { priceItems, orderTotal, type PricedItem } from "@/lib/order-pricing";
import { allowPublicRequest, allowRequest } from "@/lib/security/rate-limit";
import { isSameOriginRequest, readJsonBody } from "@/lib/security/request-body";

/** Rate limit en memoria: 30 pedidos/min por IP+slug (mismo patrón que el mesero). */

/**
 * POST /api/orders — público, SIN auth.
 * Crea un pedido para la org del slug. Acepta slugs de menú y de catálogo
 * (el catálogo es público siempre; el menú mantiene su gate propio).
 * Si ninguno resuelve, 404.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    if (!(await allowRequest("orders-ingress", "all", 1000, 60))) return NextResponse.json({ ok: false, error: "Demasiadas solicitudes" }, { status: 429 });
    const body = await readJsonBody(req, 65_536).catch(() => null);

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Pedido inválido" }, { status: 400 });
    }
    const data = parsed.data;
    if (!(await allowPublicRequest(req, "orders", data.slug.toLowerCase(), 300, 30))) {
      return NextResponse.json({ ok: false, error: "Muchos pedidos seguidos, esperá un minuto" }, { status: 429 });
    }

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
    let total: number;
    try {
      priced = priceItems(products, data.items);
      total = orderTotal(priced);
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Pedido inválido" },
        { status: 400 },
      );
    }

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
    if (!own?.organization || own.organization.status !== "active") {
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

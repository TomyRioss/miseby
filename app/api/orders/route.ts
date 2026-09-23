import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getPublicMenuBySlug } from "@/lib/services/public-menu";
import { getPublicCatalogBySlug } from "@/lib/services/catalog";
import { createOrderSchema, updateOrderStatusSchema } from "@/lib/validations/order";

/**
 * POST /api/orders — público, SIN auth.
 * Crea un pedido para la org del slug. Acepta slugs de menú y de catálogo
 * (el catálogo es público siempre; el menú mantiene su gate propio).
 * Si ninguno resuelve, 404.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Pedido inválido" }, { status: 400 });
    }
    const data = parsed.data;

    const menu = await getPublicMenuBySlug(data.slug);
    let organizationId: string | null = menu?.organization.id ?? null;
    if (!organizationId) {
      const catalog = await getPublicCatalogBySlug(data.slug);
      if (catalog) {
        const org = await prisma.organization.findUnique({
          where: { slug: catalog.slug },
          select: { id: true },
        });
        organizationId = org?.id ?? null;
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

    const total = data.items.reduce((acc, it) => acc + it.price * it.qty, 0);

    const order = await prisma.order.create({
      data: {
        organizationId: org.id,
        items: data.items,
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

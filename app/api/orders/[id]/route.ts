import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { updateOrderStatusSchema } from "@/lib/validations/order";

const TERMINAL_STATES = new Set(["entregado", "cancelado"]);

/**
 * PATCH /api/orders/[id] — auth, solo owner/admin del mismo org (member 403).
 * Bloquea revivir pedidos en estado terminal.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    const own = await getOrganizationForMember(user.id);
    if (!own?.organization) {
      return NextResponse.json({ ok: false, error: "Sin organización" }, { status: 403 });
    }
    if (own.role === "business_member") {
      return NextResponse.json({ ok: false, error: "Sin permiso" }, { status: 403 });
    }

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    }
    const body = await req.json().catch(() => null);
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.organizationId !== own.organization.id) {
      return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
    }
    if (TERMINAL_STATES.has(order.status) && order.status !== parsed.data.status) {
      return NextResponse.json(
        { ok: false, error: "No se puede cambiar un pedido finalizado" },
        { status: 400 },
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ ok: true, order: updated });
  } catch (e) {
    console.error("[orders PATCH]", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

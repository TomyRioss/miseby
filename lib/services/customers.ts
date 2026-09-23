import { prisma } from "@/lib/prisma";

export type ClientEntry = {
  name: string;
  phone: string;
  email: string;
  ordersCount: number;
  lastOrderAt: string;
  totalSpent: number;
};

function digits(v: string): string {
  return v.replace(/\D+/g, "");
}

/**
 * Clientes derivados de los pedidos de la organización.
 * Agrupa por teléfono normalizado (solo dígitos): 3 pedidos
 * (2 de tomy + 1 de juanita con el mismo teléfono) = 1 cliente.
 * Sin teléfono agrupa por nombre normalizado como fallback.
 * Ordenado por última compra descendente.
 */
export async function getClientsByOrg(organizationId: string): Promise<ClientEntry[]> {
  const orders = await prisma.order.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      customerName: true,
      customerPhone: true,
      total: true,
      createdAt: true,
    },
  });

  // customerEmail lo cablea el BE (columna nueva): lectura defensiva
  // para no romper antes del merge.
  type WithMail = { customerEmail?: unknown };
  const full = orders as (typeof orders[number] & WithMail)[];

  const byKey = new Map<string, ClientEntry>();
  for (const o of full) {
    const phone = (o.customerPhone ?? "").trim();
    const key = digits(phone) || `nombre:${(o.customerName ?? "").trim().toLowerCase()}`;
    if (!key || key === "nombre:") continue;
    const mail = typeof o.customerEmail === "string" ? o.customerEmail.trim() : "";
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, {
        name: (o.customerName ?? "").trim() || "Sin nombre",
        phone,
        email: mail,
        ordersCount: 1,
        lastOrderAt: o.createdAt.toISOString(),
        totalSpent: o.total ?? 0,
      });
    } else {
      prev.ordersCount += 1;
      prev.totalSpent += o.total ?? 0;
      if (!prev.email && mail) prev.email = mail;
      // orders viene desc: el primero visto es el más reciente (nombre última compra).
    }
  }
  return [...byKey.values()];
}

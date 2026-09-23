import { prisma } from "@/lib/prisma";

export interface ClientEntry {
  name: string;
  phone: string;
  email: string | null;
  ordersCount: number;
  /** ISO string del último pedido del cliente. */
  lastOrderAt: string;
  totalSpent: number;
}

/** Nombre: trim + lowercase colapsando espacios internos. */
export function normalizeClientName(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Teléfono: solo dígitos (quita +, espacios, guiones, paréntesis). */
export function normalizeClientPhone(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/** Mail: trim + lowercase. Vacío → null. */
export function normalizeClientEmail(value: string | null | undefined): string | null {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  return normalized === "" ? null : normalized;
}

function isValidOrgId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function clientKey(o: { customerName: string; customerPhone: string; customerEmail: string | null }): string | null {
  const phone = normalizeClientPhone(o.customerPhone);
  if (phone) return `phone:${phone}`;
  const email = normalizeClientEmail(o.customerEmail);
  if (email) return `email:${email}`;
  const name = normalizeClientName(o.customerName);
  if (name) return `name:${name}`;
  return null;
}

/**
 * Lee los pedidos de UNA org (scoping estricto por organizationId, nunca
 * cruza datos entre orgs) y agrupa por cliente con prioridad de clave:
 * teléfono (dígitos) → email → nombre normalizado.
 * Ordenado por lastOrderAt desc.
 */
export async function getClientsByOrg(organizationId: string): Promise<ClientEntry[]> {
  if (!isValidOrgId(organizationId)) {
    throw new Error("organizationId inválido");
  }

  const orders = await prisma.order.findMany({
    where: { organizationId },
    select: {
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const byKey = new Map<string, ClientEntry>();

  for (const o of orders) {
    const key = clientKey(o);
    if (!key) continue;
    const existing = byKey.get(key);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += o.total;
      if (!existing.name && o.customerName.trim()) existing.name = o.customerName.trim();
      if (!existing.phone && o.customerPhone.trim()) existing.phone = o.customerPhone.trim();
      if (!existing.email) existing.email = normalizeClientEmail(o.customerEmail);
      continue;
    }
    byKey.set(key, {
      name: o.customerName.trim(),
      phone: o.customerPhone.trim(),
      email: normalizeClientEmail(o.customerEmail),
      ordersCount: 1,
      lastOrderAt: o.createdAt.toISOString(),
      totalSpent: o.total,
    });
  }

  return [...byKey.values()].sort((a, b) => (a.lastOrderAt < b.lastOrderAt ? 1 : -1));
}

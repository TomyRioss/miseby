"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, MapPin, Phone, ReceiptText, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "en_preparacion"
  | "listo"
  | "entregado"
  | "cancelado";

type OrderItem = { id: string; name: string; price: number; qty: number };

type Order = {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  total?: number;
  fulfillment?: string;
  payMethod?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  createdAt: string;
};

const FILTERS: { value: OrderStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "listo", label: "Listo" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

const NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pendiente: { to: "confirmado", label: "Confirmar" },
  confirmado: { to: "en_preparacion", label: "Preparar" },
  en_preparacion: { to: "listo", label: "Marcar listo" },
  listo: { to: "entregado", label: "Marcar entregado" },
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    console.error("[pedidos date]", e);
    return iso;
  }
}

function orderTotal(o: Order): number {
  if (typeof o.total === "number") return o.total;
  return (o.items ?? []).reduce((n, x) => n + (x.qty ?? 0) * (x.price ?? 0), 0);
}

export function PedidosManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error(`GET /api/orders ${res.status}`);
        const data = await res.json();
        const list: Order[] = Array.isArray(data) ? data : (data.orders ?? data.data ?? []);
        if (alive) setOrders(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("[pedidos load]", e);
        if (alive) toast.error("No se pudieron cargar los pedidos.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function changeStatus(id: string, status: OrderStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`PATCH /api/orders/${id} ${res.status}`);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success("Estado actualizado.");
    } catch (e) {
      console.error("[pedidos status]", e);
      toast.error("No se pudo cambiar el estado.");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = useMemo(
    () => (filter === "todos" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  if (loading) {
    return <p className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Cargando pedidos…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`min-h-9 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "border-[#0A2540] bg-[#0A2540] text-white"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
          <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Todavía no hay pedidos acá.</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {orders.length === 0
              ? "Cuando un cliente confirme desde tu menú o catálogo, lo vas a ver en esta lista."
              : "Ningún pedido tiene ese estado por ahora."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filtered.map((o) => {
            const open = expanded === o.id;
            const next = NEXT_STATUS[o.status];
            return (
              <article key={o.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : o.id)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center gap-2 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {o.customerName?.trim() || "Sin nombre"} · ${orderTotal(o).toLocaleString("es-AR")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(o.createdAt)}</p>
                  </div>
                  <Badge variant={o.status === "cancelado" ? "destructive" : "secondary"} className="shrink-0">
                    {FILTERS.find((f) => f.value === o.status)?.label ?? o.status}
                  </Badge>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                    <ul className="space-y-1">
                      {(o.items ?? []).map((it) => (
                        <li key={it.id} className="flex justify-between gap-2 text-xs">
                          <span className="min-w-0 truncate">{it.qty}x {it.name}</span>
                          <span className="shrink-0 font-semibold tabular-nums">${(it.qty * it.price).toLocaleString("es-AR")}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm font-bold tabular-nums">Total: ${orderTotal(o).toLocaleString("es-AR")}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 shrink-0" /> {o.customerName?.trim() || "Sin nombre"}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {o.customerPhone ? (
                        <a className="font-medium text-[#6D28D9] hover:underline" href={`tel:${o.customerPhone.replace(/\s+/g, "")}`}>{o.customerPhone}</a>
                      ) : ("Sin teléfono")}
                    </p>
                    {o.customerAddress ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> {o.customerAddress}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {next && (
                        <Button
                          onClick={() => changeStatus(o.id, next.to)}
                          disabled={updating === o.id}
                          className="min-h-10 bg-[#0A2540] text-white hover:bg-[#0A2540]/90 active:scale-[0.98] disabled:opacity-60"
                        >
                          {updating === o.id ? "Guardando…" : next.label}
                        </Button>
                      )}
                      {o.status !== "cancelado" && o.status !== "entregado" && (
                        <Button
                          variant="outline"
                          onClick={() => changeStatus(o.id, "cancelado")}
                          disabled={updating === o.id}
                          className="min-h-10 text-destructive hover:text-destructive disabled:opacity-60"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

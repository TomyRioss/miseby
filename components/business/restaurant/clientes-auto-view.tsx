"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, MapPin, Phone, Plus, ReceiptText, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ClientEntry } from "@/lib/services/customers";

type ManualClient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  lastVisit?: string | null;
  createdAt: string;
};

type Fused = ClientEntry & { key: string; manual: boolean; manualEntry?: ManualClient };

type HistOrder = {
  id: string;
  items: { id: string; name: string; price: number; qty: number }[];
  total?: number;
  customerPhone?: string | null;
  createdAt: string;
};

/** Misma key que el manager anterior: los manuales ya guardados se siguen viendo. */
const KEY = "miseby.clientes.v1";

function digits(v: string): string {
  return (v ?? "").replace(/\D+/g, "");
}

function loadManual(): ManualClient[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[clientes manual load]", e);
    return [];
  }
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    console.error("[clientes date]", e);
    return iso;
  }
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    console.error("[clientes datetime]", e);
    return iso;
  }
}

function fmtMoney(n: number): string {
  return `$${(n ?? 0).toLocaleString("es-AR")}`;
}

export function ClientesAutoView({ initialClients }: { initialClients: ClientEntry[] }) {
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [manual, setManual] = useState<ManualClient[]>(() => loadManual());
  const [history, setHistory] = useState<HistOrder[]>([]);
  const [mName, setMName] = useState("");
  const [mPhone, setMPhone] = useState("");
  const [mEmail, setMEmail] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error(`GET /api/orders ${res.status}`);
        const data = await res.json();
        const list: HistOrder[] = Array.isArray(data) ? data : (data.orders ?? data.data ?? []);
        if (alive) setHistory(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("[clientes history]", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const fused = useMemo<Fused[]>(() => {
    const rows: Fused[] = initialClients.map((c, i) => ({
      ...c,
      key: `auto-${digits(c.phone) || c.name.toLowerCase()}-${i}`,
      manual: false,
    }));
    const byDigits = new Map(rows.map((r) => [digits(r.phone), r]));
    const extra: Fused[] = [];
    for (const m of manual) {
      const d = digits(m.phone);
      const match = d ? byDigits.get(d) : undefined;
      if (match) {
        match.manual = true;
        match.manualEntry = m;
        if (!match.email && m.email) match.email = m.email;
      } else {
        extra.push({
          key: m.id,
          name: m.name,
          phone: m.phone ?? "",
          email: m.email ?? "",
          ordersCount: 0,
          lastOrderAt: m.createdAt,
          totalSpent: 0,
          manual: true,
          manualEntry: m,
        });
      }
    }
    return [...rows, ...extra];
  }, [initialClients, manual]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fused;
    return fused.filter((c) =>
      [c.name, c.phone, c.email].some((f) => (f ?? "").toLowerCase().includes(q)),
    );
  }, [fused, query]);

  const selected = fused.find((c) => c.key === selectedKey) ?? null;

  const selectedHistory = useMemo(() => {
    if (!selected || selected.ordersCount === 0) return [];
    const d = digits(selected.phone);
    if (!d) return [];
    return history
      .filter((o) => digits(o.customerPhone ?? "") === d)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8);
  }, [history, selected]);

  function persist(next: ManualClient[]) {
    setManual(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      console.error("[clientes manual save]", e);
      toast.error("No se pudo guardar en este dispositivo.");
    }
  }

  function addManual() {
    const n = mName.trim();
    if (!n) return toast.error("Poné al menos el nombre.");
    const mail = mEmail.trim();
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail))
      return toast.error("Revisá el formato del email.");
    const c: ManualClient = {
      id: `cli-${Date.now().toString(36)}`,
      name: n,
      phone: mPhone.trim(),
      email: mail,
      createdAt: new Date().toISOString(),
    };
    const next = [c, ...manual];
    persist(next);
    setMName("");
    setMPhone("");
    setMEmail("");
    toast.success(`${n} agendado.`);
  }

  function removeManual(id: string) {
    const target = manual.find((c) => c.id === id);
    persist(manual.filter((c) => c.id !== id));
    if (selected?.manualEntry?.id === id) setSelectedKey(null);
    toast.success(target ? `${target.name} eliminado.` : "Eliminado.");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Lista */}
      <section className={`rounded-2xl border border-border bg-card p-5 ${selected ? "hidden lg:block" : ""}`}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#6D28D9]" />
          <h2 className="text-base font-semibold tracking-tight">Clientes</h2>
          <Badge variant="secondary" className="ml-auto tabular-nums">{fused.length}</Badge>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o mail…"
            aria-label="Buscar clientes"
            className="min-h-10 pl-9"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={mName}
            onChange={(e) => setMName(e.target.value)}
            placeholder="Nombre *"
            maxLength={80}
            onKeyDown={(e) => { if (e.key === "Enter") addManual(); }}
            aria-label="Nombre del cliente"
            className="min-h-10"
          />
          <Button
            onClick={addManual}
            disabled={!mName.trim()}
            className="min-h-10 shrink-0 bg-[#0A2540] text-white hover:bg-[#0A2540]/90 active:scale-[0.98]"
            aria-label="Agregar cliente manual"
          >
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Agregar</span>
          </Button>
        </div>
        <div className="mt-2 flex gap-2">
          <Input value={mPhone} onChange={(e) => setMPhone(e.target.value)} placeholder="Teléfono" inputMode="tel" maxLength={30} aria-label="Teléfono" className="min-h-10" />
          <Input value={mEmail} onChange={(e) => setMEmail(e.target.value)} placeholder="Email" inputMode="email" type="email" maxLength={120} aria-label="Email" className="min-h-10" />
        </div>
        <div className="mt-3 flex max-h-[46vh] flex-col gap-2 overflow-y-auto lg:max-h-[52vh]">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {fused.length === 0 ? "Todavía no hay clientes. Cuando entren pedidos desde tu menú o catálogo aparecen acá." : "Sin resultados para esa búsqueda."}
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelectedKey(c.key)}
                className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted ${c.key === selectedKey ? "border-[#6D28D9]/40 bg-[#6D28D9]/5" : "border-border"}`}
              >
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.name}</span>
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {c.ordersCount} {c.ordersCount === 1 ? "pedido" : "pedidos"}
                  </Badge>
                  {c.manual && <Badge variant="outline" className="shrink-0">Manual</Badge>}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {[c.phone || "Sin teléfono", c.email || null].filter(Boolean).join(" · ") || "Sin contacto"} · Últ. compra {c.ordersCount > 0 ? fmtDate(c.lastOrderAt) : "—"}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Detalle */}
      <section className={`rounded-2xl border border-border bg-card p-5 sm:p-6 ${selected ? "" : "hidden lg:block"}`}>
        {!selected ? (
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">Elegí un cliente de la lista para ver su detalle.</p>
        ) : (
          <div>
            <button type="button" onClick={() => setSelectedKey(null)} className="cursor-pointer mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground lg:hidden">
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a la lista
            </button>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
                  {selected.name}
                  {selected.manual && <Badge variant="outline">Manual</Badge>}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selected.ordersCount} {selected.ordersCount === 1 ? "pedido" : "pedidos"} · {fmtMoney(selected.totalSpent)} total
                </p>
              </div>
              {selected.manualEntry && (
                <Button variant="outline" onClick={() => removeManual(selected.manualEntry!.id)} className="min-h-10 text-destructive hover:text-destructive" aria-label="Eliminar cliente manual">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selected.phone ? <a className="cursor-pointer font-medium text-[#6D28D9] hover:underline" href={`tel:${selected.phone.replace(/\s+/g, "")}`}>{selected.phone}</a> : <span className="text-muted-foreground">Sin teléfono</span>}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selected.email ? <a className="cursor-pointer font-medium text-[#6D28D9] hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a> : <span className="text-muted-foreground">Sin email</span>}
              </p>
              {selected.manualEntry?.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" /> {selected.manualEntry.address}
                </p>
              )}
            </div>
            <div className="mt-5">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <ReceiptText className="h-4 w-4 text-muted-foreground" /> Historial de pedidos
              </h3>
              {selected.ordersCount === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                  Todavía no tiene pedidos registrados.
                </p>
              ) : selectedHistory.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                  No se pudo cargar el historial ahora.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {selectedHistory.map((o) => (
                    <li key={o.id} className="rounded-xl border border-border px-4 py-3">
                      <p className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">{fmtDateTime(o.createdAt)}</span>
                        <span className="font-bold tabular-nums">{fmtMoney(typeof o.total === "number" ? o.total : (o.items ?? []).reduce((n, x) => n + (x.qty ?? 0) * (x.price ?? 0), 0))}</span>
                      </p>
                      <ul className="mt-1.5 space-y-0.5">
                        {(o.items ?? []).map((it) => (
                          <li key={it.id} className="flex justify-between gap-2 text-xs text-muted-foreground">
                            <span className="min-w-0 truncate">{it.qty}x {it.name}</span>
                            <span className="shrink-0 tabular-nums">{fmtMoney(it.qty * it.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarCheck, MapPin, NotebookPen, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Client = {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  lastVisit: string | null;
  createdAt: string;
};

const KEY = "miseby.clientes.v1";

function load(): Client[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[clientes load]", e);
    return [];
  }
}

function persist(list: Client[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    console.error("[clientes save]", e);
    toast.error("No se pudo guardar en este dispositivo.");
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Sin visitas aún";
  try {
    return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    console.error("[clientes date]", e);
    return iso;
  }
}

export function ClientesManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setClients(load());
  }, []);

  function update(next: Client[]) {
    setClients(next);
    persist(next);
  }

  function add() {
    const n = name.trim();
    if (!n) return toast.error("Poné al menos el nombre.");
    const c: Client = {
      id: `cli-${Date.now().toString(36)}`,
      name: n,
      phone: phone.trim(),
      address: address.trim(),
      notes: "",
      lastVisit: null,
      createdAt: new Date().toISOString(),
    };
    update([c, ...clients]);
    setName("");
    setPhone("");
    setAddress("");
    setSelectedId(c.id);
    toast.success(`${n} agendado.`);
  }

  function markVisit(id: string) {
    update(clients.map((c) => (c.id === id ? { ...c, lastVisit: new Date().toISOString() } : c)));
    toast.success("Visita registrada hoy.");
  }

  function saveNotes(id: string) {
    update(clients.map((c) => (c.id === id ? { ...c, notes } : c)));
    toast.success("Nota guardada.");
  }

  function remove(id: string) {
    const target = clients.find((c) => c.id === id);
    update(clients.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setNotes("");
    }
    toast.success(target ? `${target.name} eliminado.` : "Eliminado.");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.phone, c.address].some((f) => f.toLowerCase().includes(q)),
    );
  }, [clients, query]);

  function select(id: string) {
    const c = clients.find((x) => x.id === id) ?? null;
    setSelectedId(id);
    setNotes(c?.notes ?? "");
  }

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Lista */}
      <section className={`rounded-2xl border border-border bg-card p-5 ${selected ? "hidden lg:block" : ""}`}>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#6D28D9]" />
          <h2 className="text-base font-semibold tracking-tight">Lista</h2>
          <Badge variant="secondary" className="ml-auto tabular-nums">{clients.length}</Badge>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, teléfono…" aria-label="Buscar clientes" className="min-h-10 pl-9" />
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre *" maxLength={80}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }} aria-label="Nombre del cliente" className="min-h-10" />
          <Button onClick={add} disabled={!name.trim()} className="min-h-10 shrink-0 bg-[#0A2540] text-white hover:bg-[#0A2540]/90 active:scale-[0.98]" aria-label="Agregar cliente">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">Agregar</span>
          </Button>
        </div>
        <div className="mt-2 flex gap-2">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" inputMode="tel" maxLength={30} aria-label="Teléfono" className="min-h-10" />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección" maxLength={120} aria-label="Dirección" className="min-h-10" />
        </div>
        <div className="mt-3 flex max-h-[46vh] flex-col gap-2 overflow-y-auto lg:max-h-[52vh]">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              {clients.length === 0 ? "Todavía no hay clientes. Agregá el primero arriba." : "Sin resultados para esa búsqueda."}
            </p>
          ) : (
            filtered.map((c) => (
              <button key={c.id} type="button" onClick={() => select(c.id)}
                className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted ${c.id === selectedId ? "border-[#6D28D9]/40 bg-[#6D28D9]/5" : "border-border"}`}>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.phone || "Sin teléfono"} · {fmtDate(c.lastVisit)}</p>
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
            <button type="button" onClick={() => setSelectedId(null)} className="cursor-pointer mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground lg:hidden">
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a la lista
            </button>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{selected.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Cliente desde {fmtDate(selected.createdAt)}</p>
              </div>
              <Button variant="outline" onClick={() => remove(selected.id)} className="min-h-10 text-destructive hover:text-destructive" aria-label="Eliminar cliente">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selected.phone ? <a className="cursor-pointer font-medium text-[#6D28D9] hover:underline" href={`tel:${selected.phone.replace(/\s+/g, "")}`}>{selected.phone}</a> : <span className="text-muted-foreground">Sin teléfono</span>}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selected.address || <span className="text-muted-foreground">Sin dirección</span>}
              </p>
              <p className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                Última visita: <strong>{fmtDate(selected.lastVisit)}</strong>
              </p>
              <Button onClick={() => markVisit(selected.id)} className="min-h-10 bg-[#0A2540] text-white hover:bg-[#0A2540]/90 active:scale-[0.98]">
                Registrar visita hoy
              </Button>
            </div>
            <div className="mt-5">
              <label htmlFor="cli-notes" className="flex items-center gap-1.5 text-sm font-medium">
                <NotebookPen className="h-4 w-4 text-muted-foreground" /> Notas y pedidos
              </label>
              <textarea id="cli-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={2000}
                placeholder="Ej: alergia a frutos secos, siempre pide mesa afuera…" className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20" />
              <Button variant="outline" onClick={() => saveNotes(selected.id)} disabled={notes === selected.notes} className="mt-2 min-h-10">
                Guardar nota
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

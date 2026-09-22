"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Clock, Menu as MenuIcon, Search, Share2, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import {
  formatPrice,
  productMinPrice,
  type RestaurantAppearance,
  type RestaurantCategory,
  type RestaurantProduct,
  type WeekSchedule,
  type DayKey,
} from "@/lib/restaurant-theme";
import { usePedido } from "./use-pedido";
import { MeseroWidget } from "./mesero-widget";

const DAY_MAP: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/* Estado abierto/cerrado con hora real, multi-slot + nocturnos.
   Cerrado siempre con hora 24hs: "Cerrado abre a las HH:MMhs". */
function scheduleStatus(schedule?: WeekSchedule, now: Date = new Date()): { open: boolean; text: string } | null {
  if (!schedule) return null;
  const dayIdx = (now.getDay() + 6) % 7; // 0=Mon
  const today = schedule.days[DAY_MAP[dayIdx]];
  const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (today?.enabled && today.slots.length > 0) {
    const slots = [...today.slots].sort((a, b) => a.open.localeCompare(b.open));
    for (const s of slots) {
      const overnight = s.close <= s.open;
      const isOpen = overnight ? cur >= s.open || cur < s.close : cur >= s.open && cur < s.close;
      if (isOpen) return { open: true, text: `Abierto — Cierra a las ${s.close}` };
    }
    const next = slots.find((s) => cur < s.open);
    if (next) return { open: false, text: `Cerrado abre a las ${next.open}hs` };
  }
  // Busca la próxima apertura en los siguientes 6 días.
  for (let d = 1; d < 7; d++) {
    const day = schedule.days[DAY_MAP[(dayIdx + d) % 7]];
    if (day?.enabled && day.slots.length > 0) {
      const first = [...day.slots].sort((a, b) => a.open.localeCompare(b.open))[0];
      return { open: false, text: `Cerrado abre a las ${first.open}hs` };
    }
  }
  return { open: false, text: "Cerrado hoy" };
}

function hexA(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}

function titleCls(font: RestaurantAppearance["titleFont"]) {
  if (font === "serif") return "font-serif";
  if (font === "mono") return "font-mono uppercase";
  return "";
}

function bodyCls(font: RestaurantAppearance["bodyFont"]) {
  if (font === "serif") return "font-serif";
  if (font === "mono") return "font-mono";
  return "";
}

export function PlatoMenuView({
  appearance: ap,
  categories = [],
  products = [],
  currency = "COP",
  restaurantName,
  logoUrl,
  whatsapp,
  slug,
  schedule,
  hours,
  meseroActive = false,
}: {
  appearance: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  restaurantName?: string;
  logoUrl?: string;
  whatsapp?: string | null;
  slug: string;
  schedule?: WeekSchedule;
  hours?: string;
  meseroActive?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [meseroOpen, setMeseroOpen] = useState(false);
  const router = useRouter();
  const { add, count } = usePedido(slug);

  const name = restaurantName || ap.restaurantName || "";
  const cur = currency ?? "COP";
  const text = ap.text || "#171717";
  const primary = ap.primary || "#0A2540";
  const secondary = ap.secondary || "#6D28D9";
  const bg = ap.background || "#FFFFFF";
  const light = hexA(secondary, "26");
  const sub = hexA(text, "99");
  const border = hexA(text, "1F");

  const status = useMemo(() => scheduleStatus(schedule), [schedule]);
  const hoursFallback = !status && hours?.trim() ? hours.trim() : null;

  const cats = useMemo(() => [...(categories ?? [])].sort((a, b) => a.order - b.order), [categories]);
  const available = useMemo(() => (products ?? []).filter((p) => p.available), [products]);

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.trim().toLowerCase();
    return available.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q),
    );
  }, [available, search]);

  const byCat = (id: string) => filtered.filter((p) => p.categoryId === id);
  // Id seleccionado válido derivado (sin efecto): si el producto deja de estar
  // disponible se ignora en la selección y el resaltado.
  const validSelectedId = selectedId && available.some((p) => p.id === selectedId) ? selectedId : null;
  const selected = validSelectedId ? (available.find((p) => p.id === validSelectedId) ?? null) : null;

  function share() {
    const url = `${window.location.origin}/menu/${slug}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Enlace copiado."),
      (e) => {
        console.error("[menu share]", e);
        toast.error("No se pudo copiar.");
      },
    );
  }

  function pick(p: RestaurantProduct) {
    router.push(`/menu/${slug}/${p.id}`);
  }

  function addSelected() {
    if (!selected) return;
    add({ id: selected.id, name: selected.name, price: productMinPrice(selected) });
    setSelectedId(null);
    toast.success(`${selected.name} agregado.`);
  }

  const priceOf = (p: RestaurantProduct) => formatPrice(productMinPrice(p), cur);

  return (
    <main
      className={`min-h-screen pb-24 ${bodyCls(ap.bodyFont)}`}
      style={{ background: bg, color: text, ["--pm-border" as string]: border } as React.CSSProperties}
    >
      {/* Barra utilitaria compacta: compartir + WhatsApp */}
      <div className="flex items-center justify-between px-4 py-0.5">
        <div className="flex items-center">
          <button
            type="button"
            onClick={share}
            aria-label="Compartir"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]"
            style={{ color: sub }}
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        {whatsapp ? (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D+/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#25D366" }}
          >
            <FaWhatsapp className="h-3.5 w-3.5" />
            Hablá con nosotros
          </a>
        ) : null}
      </div>

      {/* Portada + franja de estado solapada abajo, a todo ancho */}
      <header className="pb-4" style={{ background: bg }}>
        <div className="relative">
          <div
            className="h-28 w-full bg-cover bg-center md:h-40"
            style={
              ap.bannerUrl
                ? { backgroundImage: `url(${ap.bannerUrl})` }
                : { backgroundImage: `linear-gradient(90deg, ${light}, ${hexA(primary, "33")})` }
            }
            aria-hidden="true"
          />
          {(status || hoursFallback) && (
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 rounded-t-2xl py-1.5 text-xs font-bold text-white"
              style={{ background: status ? (status.open ? "#059669" : "#DC2626") : primary }}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {status ? status.text : hoursFallback}
            </div>
          )}
        </div>
        <div className="mx-auto mt-4 max-w-2xl px-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover md:h-28 md:w-28" />
            ) : (
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-3xl font-extrabold text-white md:h-28 md:w-28"
                style={{ background: `linear-gradient(140deg, ${primary}, ${secondary})` }}
                aria-hidden="true"
              >
                {name ? name.charAt(0).toUpperCase() : "R"}
              </div>
            )}
            <div className="min-w-0">
              <h1 className={`text-2xl font-bold leading-tight sm:text-3xl md:text-4xl ${titleCls(ap.titleFont)}`} style={{ color: primary }}>{name}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Nav sticky: buscador + píldoras */}
      <nav className="sticky top-0 z-10 flex flex-col gap-1 border-b px-3 py-1" style={{ background: bg, borderColor: border }}>
        <div className="mx-auto flex w-full max-w-2xl items-center gap-1.5 rounded-lg bg-black/[0.06] px-2.5 py-1">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar productos"
            className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-black/40"
            style={{ color: text }}
          />
          <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </div>
        <div className="mx-auto flex w-full max-w-2xl items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex h-6 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors hover:bg-black/[0.04]"
            style={{ borderColor: border }}
          >
            <MenuIcon className="h-3.5 w-3.5" />
            Menú
          </button>
          {meseroActive && (
            <button
              type="button"
              onClick={() => setMeseroOpen(true)}
              aria-label="Hablar con el mesero IA"
              className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: secondary }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mesero IA
            </button>
          )}
          <div className="h-4 w-px shrink-0" style={{ background: border }} />
          {cats.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-black/[0.04]"
              style={{ borderColor: border }}
            >
              {c.name}
            </a>
          ))}
        </div>
      </nav>

      {/* Categorías */}
      <div className="mx-auto max-w-2xl px-4 lg:max-w-4xl">
        {cats.map((c, ci) => {
          const prods = byCat(c.id);
          if (prods.length === 0) return null;
          return (
            <details key={c.id} id={`cat-${c.id}`} open className="group scroll-mt-16 pt-6 first:pt-4">
              <summary className={`mb-3 flex cursor-pointer list-none items-center justify-between border-b pb-2 text-lg font-bold uppercase tracking-tight ${titleCls(ap.titleFont)}`} style={{ borderColor: border, color: primary }}>
                {c.name}
                <ChevronDown className="h-5 w-5 shrink-0 opacity-50 transition-transform group-open:rotate-180" />
              </summary>
              {ci === 0 ? (
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
                  {prods.map((p) => (
                    <div
                      key={p.id}
                      id={`prod-${p.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => pick(p)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pick(p);
                        }
                      }}
                      className={`w-40 shrink-0 scroll-mt-16 cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm lg:w-52 ${validSelectedId === p.id ? "ring-2" : ""}`}
                      style={{ borderColor: validSelectedId === p.id ? primary : border, ["--tw-ring-color" as string]: primary } as React.CSSProperties}
                    >
                      {ap.showImages && p.imageUrl ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-28 w-full bg-black/[0.04] object-cover lg:h-36" />
                        </div>
                      ) : null}
                      <div className="p-2.5">
                        <p title={p.name} className="line-clamp-2 min-h-9 text-[13px] font-semibold leading-snug">{p.name}</p>
                        {ap.showDescriptions && p.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: sub }}>{p.description}</p>
                        ) : null}
                        {ap.showPrices ? (
                          <p className="mt-1 font-bold" style={{ color: secondary }}>{priceOf(p)}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {prods.map((p) => (
                    <div
                      key={p.id}
                      id={`prod-${p.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => pick(p)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pick(p);
                        }
                      }}
                      className={`flex scroll-mt-16 cursor-pointer items-center gap-3 rounded-lg bg-white p-3 shadow-sm lg:gap-5 lg:p-5 ${validSelectedId === p.id ? "ring-2" : ""}`}
                      style={{ ["--tw-ring-color" as string]: primary } as React.CSSProperties}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold lg:text-lg">{p.name}</p>
                        {ap.showDescriptions && p.description ? (
                          <p className="mt-0.5 line-clamp-2 text-sm lg:text-base" style={{ color: sub }}>{p.description}</p>
                        ) : null}
                        {ap.showPrices ? (
                          <p className="mt-1 font-bold lg:text-lg" style={{ color: secondary }}>{priceOf(p)}</p>
                        ) : null}
                      </div>
                      {ap.showImages && p.imageUrl ? (
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-20 w-20 rounded-lg bg-black/[0.04] object-cover lg:h-32 lg:w-32" />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </details>
          );
        })}

        {available.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-lg font-bold">Carta en preparación</p>
            <p className="text-sm opacity-60">Este local aún no publicó platos. Volvé pronto.</p>
          </div>
        )}
        {available.length > 0 && filtered.length === 0 && search.trim() && (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-lg font-bold">Sin resultados</p>
            <p className="text-sm opacity-60">No encontramos &ldquo;{search}&rdquo;</p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="min-h-[40px] cursor-pointer rounded-full px-5 py-2 text-sm font-bold text-white"
              style={{ background: primary }}
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

      {/* Barra inferior: agregar / ver pedido */}
      {selected && count === 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-2xl border-t p-4" style={{ background: bg, borderColor: border }}>
          <button
            type="button"
            onClick={addSelected}
            className="w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: primary }}
          >
            Agregar a mi pedido · {priceOf(selected)}
          </button>
        </div>
      )}
      {count > 0 && (
        <a
          href={`/menu/${slug}/checkout`}
          aria-label={`Ver pedido, ${count} producto${count === 1 ? "" : "s"}`}
          className="fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-2xl cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white shadow-lg transition-opacity hover:opacity-90"
          style={{ background: primary }}
        >
          <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
          Ver pedido, {count} producto{count === 1 ? "" : "s"}
        </a>
      )}
      {meseroActive && <MeseroWidget slug={slug} restaurantName={name} accent={secondary} hideFab open={meseroOpen} onOpenChange={setMeseroOpen} />}
    </main>
  );
}

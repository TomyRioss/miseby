"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Copy, Info, Package, Plus, Search, Share2, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { toast } from "sonner";
import { usePedido } from "@/components/menu/use-pedido";
import {
  formatPrice,
  productMinPrice,
  type RestaurantAppearance,
  type RestaurantCategory,
  type RestaurantProduct,
  type WeekSchedule,
  type DayKey,
} from "@/lib/restaurant-theme";

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

const DAY_MAP: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/* Calcula abierto/cerrado contra la hora real de render (no módulo) y
   soporta varios slots por día + slots nocturnos (cierre < apertura).
   Cerrado siempre con hora 24hs: label "Cerrado abre a las HH:MMhs". */
function computeScheduleStatus(
  schedule?: WeekSchedule,
  now: Date = new Date(),
): { open: boolean; label: string; timeLabel: string } | null {
  if (!schedule) return null;
  const dayIndex = (now.getDay() + 6) % 7; // 0=Mon
  const todayKey = DAY_MAP[dayIndex];
  const today = schedule.days[todayKey];
  if (today?.enabled && today.slots.length > 0) {
    const current = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const slots = [...today.slots].sort((a, b) => a.open.localeCompare(b.open));
    for (const slot of slots) {
      const overnight = slot.close <= slot.open;
      const isOpen = overnight
        ? current >= slot.open || current < slot.close
        : current >= slot.open && current < slot.close;
      if (isOpen) {
        return { open: true, label: "Abierto", timeLabel: `Cierra a las ${slot.close}` };
      }
    }
    const next = slots.find((s) => current < s.open);
    if (next) {
      return { open: false, label: `Cerrado abre a las ${next.open}hs`, timeLabel: "" };
    }
  }
  // Busca la próxima apertura en los siguientes 6 días.
  for (let d = 1; d < 7; d++) {
    const day = schedule.days[DAY_MAP[(dayIndex + d) % 7]];
    if (day?.enabled && day.slots.length > 0) {
      const first = [...day.slots].sort((a, b) => a.open.localeCompare(b.open))[0];
      return { open: false, label: `Cerrado abre a las ${first.open}hs`, timeLabel: "" };
    }
  }
  return { open: false, label: "Cerrado hoy", timeLabel: "" };
}

/* ------------------------------------------------------------------ */
/*  Top-bar utilitaria                                                 */
/* ------------------------------------------------------------------ */
function UtilityBar({ onInfoClick, onShareClick, rewardsAvailable }: { onInfoClick?: () => void; onShareClick?: () => void; rewardsAvailable?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3">
        {onInfoClick && (
          <button type="button" onClick={onInfoClick} className="min-h-[36px] min-w-[36px] cursor-pointer rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10" aria-label="Información">
            <Info className="h-4 w-4 opacity-60" />
          </button>
        )}
        {onShareClick && (
          <button type="button" onClick={onShareClick} className="min-h-[36px] min-w-[36px] cursor-pointer rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10" aria-label="Compartir">
            <Share2 className="h-4 w-4 opacity-60" />
          </button>
        )}
      </div>
      {rewardsAvailable && (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Junta puntos y recompénsalos
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header local                                                       */
/* ------------------------------------------------------------------ */
function LocalHeader({
  restaurantName,
  logoUrl,
  primary,
  secondary,
  titleFont,
  eyebrow = "Carta digital",
}: {
  restaurantName: string;
  logoUrl: string;
  primary: string;
  secondary: string;
  titleFont: RestaurantAppearance["titleFont"];
  eyebrow?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-4">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-lg ring-1 ring-black/10 dark:ring-white/15" />
      ) : (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold tracking-tight text-white shadow-lg ring-1 ring-black/10 dark:ring-white/15"
          style={{ background: `linear-gradient(140deg, ${primary} 0%, ${secondary} 140%)` }}
          aria-hidden="true"
        >
          {restaurantName ? restaurantName.charAt(0).toUpperCase() : "R"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {restaurantName && (
          <p className={`truncate text-[16px] font-extrabold leading-tight tracking-tight ${titleCls(titleFont)}`} style={{ color: primary }}>
            {restaurantName}
          </p>
        )}
        <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.14em] opacity-45">
          {eyebrow}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Barra de búsqueda sticky                                           */
/* ------------------------------------------------------------------ */
function SearchBar({
  value,
  onChange,
  placeholder,
  background,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  background: string;
}) {
  return (
    <div className="sticky top-0 z-10 px-4 pb-3 pt-2" style={{ background }}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Buscar productos..."}
          aria-label="Buscar productos"
          className="h-11 w-full rounded-full border border-black/10 bg-white/80 pl-4 pr-11 text-[14px] text-black backdrop-blur-sm placeholder:text-black/30 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-black/10 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus:ring-white/20"
        />
        {value.trim() ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 flex min-h-[32px] min-w-[32px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4 opacity-50" />
          </button>
        ) : (
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer({ slug, primary, linkBase = "menu" }: { slug?: string; primary: string; linkBase?: string }) {
  const url = slug ? `miseby.com/${linkBase}/${slug}` : `miseby.com/${linkBase}`;
  function copyLink() {
    const full = slug ? `${window.location.origin}/${linkBase}/${slug}` : window.location.href;
    navigator.clipboard
      .writeText(full)
      .then(
        () => toast.success("Enlace copiado."),
        (e) => {
          console.error("[menu footer copy]", e);
          toast.error("No se pudo copiar.");
        },
      )
      .catch((e) => {
        console.error("[menu footer copy]", e);
        toast.error("No se pudo copiar.");
      });
  }
  return (
    <div className="flex items-center justify-between border-t border-black/10 px-5 py-3.5 dark:border-white/10">
      <span className="truncate text-[11px] text-black/40 dark:text-white/40">{url}</span>
      <button
        type="button"
        onClick={copyLink}
        className="flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.97]"
        style={{ background: primary }}
      >
        <Copy className="h-3 w-3" />
        Copiar
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

/**
 * Vista mobile pura de la carta/catálogo.
 * `variant="restaurant"`: copia gastronómica ("Carta digital", platos).
 * `variant="catalog"`: copia neutra multirubro ("Catálogo", productos).
 * Jerarquía: util-bar → franja decorativa → banda estado → header → search → categorías → footer.
 */
export function RestaurantPublicView({
  appearance: ap,
  categories = [],
  products = [],
  currency = "COP",
  hours,
  preview = true,
  restaurantName,
  slug,
  schedule,
  variant = "restaurant",
  linkBase,
}: {
  appearance: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  hours?: string;
  preview?: boolean;
  restaurantName?: string;
  slug?: string;
  schedule?: WeekSchedule;
  variant?: "restaurant" | "catalog";
  linkBase?: string;
}) {
  const isCatalog = variant === "catalog";
  const base = linkBase ?? (isCatalog ? "catalogo" : "menu");
  const [search, setSearch] = useState("");
  const displayRestaurantName = restaurantName || ap.restaurantName || "";
  const displayLogoUrl = ap.logoUrl || "";
  const displayBannerUrl = ap.bannerUrl || "";
  const scheduleStatus = useMemo(() => computeScheduleStatus(schedule), [schedule]);
  // `hours` es texto libre legacy: se muestra como banda informativa solo si
  // no hay schedule (nunca pisa el estado real del schedule).
  const hoursFallback = !scheduleStatus && hours?.trim()
    ? { open: false, label: hours.trim(), timeLabel: "" }
    : null;

  const cats = [...(categories ?? [])].sort((a, b) => a.order - b.order);
  const available = (products ?? []).filter((p) => p.available);

  // Filtro de búsqueda por nombre + descripción, sin reload (estado local)
  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.trim().toLowerCase();
    return available.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q),
    );
  }, [available, search]);

  const byCat = (id: string) => filtered.filter((p) => p.categoryId === id);

  // Carrito solo en variante catálogo pública con slug (paridad con /menu).
  const { add, count } = usePedido(slug ?? "");
  const showCart = isCatalog && !!slug;

  function handleAdd(id: string, name: string, price: number) {
    add({ id, name, price });
    toast.success(`${name} agregado.`);
  }

  function handleShare() {
    const url = slug ? `${window.location.origin}/${base}/${slug}` : window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(
        () => toast.success("Enlace copiado."),
        (e) => {
          console.error("[menu share]", e);
          toast.error("No se pudo copiar.");
        },
      )
      .catch((e) => {
        console.error("[menu share]", e);
        toast.error("No se pudo copiar.");
      });
  }

  return (
    <main
      style={{ background: ap.background, color: ap.text }}
      className={`mx-auto flex w-full max-w-[580px] flex-col ${preview ? "min-h-full" : "min-h-[100dvh] flex-1"} ${bodyCls(ap.bodyFont)}`}
    >
      {/* Top-bar utilitaria */}
      <UtilityBar onShareClick={handleShare} rewardsAvailable={false} />

      {/* Portada + franja de estado solapada abajo, a todo ancho (paridad con /menu).
          Sin banner se usa gradiente de marca; el estado va pegado abajo de la
          portada, no como banda suelta. */}
      <div className="relative">
        <div
          className="h-28 w-full bg-cover bg-center sm:h-32"
          style={
            displayBannerUrl
              ? { backgroundImage: `url(${displayBannerUrl})` }
              : { backgroundImage: `linear-gradient(135deg, ${ap.primary} 0%, ${ap.secondary} 130%), ${ap.primary}` }
          }
          aria-hidden="true"
        />
        {(scheduleStatus || hoursFallback) && (
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 rounded-t-2xl py-1.5 text-xs font-bold text-white"
            style={{ background: scheduleStatus ? (scheduleStatus.open ? "#059669" : ap.primary) : ap.primary }}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {scheduleStatus ? `${scheduleStatus.label}${scheduleStatus.timeLabel ? ` — ${scheduleStatus.timeLabel}` : ""}` : hoursFallback!.label}
          </div>
        )}
      </div>

      {/* Header local */}
      <LocalHeader
        restaurantName={displayRestaurantName}
        logoUrl={displayLogoUrl}
        primary={ap.primary}
        secondary={ap.secondary}
        titleFont={ap.titleFont}
        eyebrow={isCatalog ? "Catálogo" : "Carta digital"}
      />

      {/* Barra de búsqueda sticky */}
      <SearchBar value={search} onChange={setSearch} background={ap.background} />

      {/* Lista de categorías y productos: primera categoría en slider
          horizontal (estilo referencia), resto en listas verticales. */}
      <div className="flex-1 space-y-5 px-4 pb-4">
        {cats.map((c, ci) => {
          const prods = byCat(c.id);
          if (prods.length === 0 && search.trim()) return null;
          const isFirst = ci === 0 && !search.trim();
          return (
            <div key={c.id}>
              <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-black/10 pb-2 dark:border-white/10">
                <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: ap.secondary }}>
                  {c.name}
                </p>
                {search.trim() && prods.length > 0 && (
                  <span className="text-[11px] tabular-nums opacity-50">{prods.length}</span>
                )}
              </div>
              {prods.length === 0 ? (
                <p className="py-3 text-center text-[12px] opacity-40">Sin resultados</p>
              ) : isFirst ? (
                <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {prods.map((p) => {
                    const multi = (p.variants?.length ?? 0) > 1;
                    return (
                      <div key={p.id} className="w-44 shrink-0 snap-start overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5">
                        {ap.showImages && p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" loading="lazy" className="aspect-[4/3] w-full bg-black/[0.04] object-cover dark:bg-white/[0.06]" />
                        ) : null}
                        <div className="p-2.5">
                          <p title={p.name} className={`line-clamp-2 min-h-9 text-[13px] font-bold leading-snug ${titleCls(ap.titleFont)}`}>{p.name}</p>
                          {ap.showDescriptions && p.description ? (
                            <p className="mt-0.5 line-clamp-2 min-h-8 text-[11px] leading-snug opacity-60">{p.description}</p>
                          ) : null}
                          {ap.showPrices ? (
                            <p className="mt-1 text-[13px] font-extrabold tabular-nums" style={{ color: ap.secondary }}>
                              {multi ? `Desde ${formatPrice(productMinPrice(p), currency ?? "COP")}` : formatPrice(productMinPrice(p), currency ?? "COP")}
                            </p>
                          ) : null}
                          {showCart && (
                            <button
                              type="button"
                              onClick={() => handleAdd(p.id, p.name, productMinPrice(p))}
                              aria-label={`Agregar ${p.name} al pedido`}
                              className="mt-2 flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-full text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                              style={{ background: ap.primary }}
                            >
                              <Plus className="h-4 w-4" /> Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: `${ap.primary}15` }}>
                  {prods.map((p) => {
                    const multi = (p.variants?.length ?? 0) > 1;
                    return (
                      <div key={p.id} className="flex items-start justify-between gap-3 py-3 transition-colors duration-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                        <div className="min-w-0 flex-1">
                          <p className={`text-[14px] font-semibold leading-snug ${titleCls(ap.titleFont)}`}>{p.name}</p>
                          {ap.showDescriptions && p.description ? (
                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed opacity-60">{p.description}</p>
                          ) : null}
                          {multi ? <p className="mt-0.5 text-[11px] opacity-40">{p.variants!.length} opciones</p> : null}
                          {ap.showPrices ? (
                            <p
                              className="mt-1 text-[13px] font-extrabold tabular-nums"
                              style={{ color: ap.secondary }}
                            >
                              {multi ? `Desde ${formatPrice(productMinPrice(p), currency ?? "COP")}` : formatPrice(productMinPrice(p), currency ?? "COP")}
                            </p>
                          ) : null}
                        </div>
                        {ap.showImages && p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl bg-black/[0.04] object-cover dark:bg-white/[0.06]" />
                        ) : null}
                        {showCart && (
                          <button
                            type="button"
                            onClick={() => handleAdd(p.id, p.name, productMinPrice(p))}
                            aria-label={`Agregar ${p.name} al pedido`}
                            className="mt-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
                            style={{ background: ap.primary }}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {available.length === 0 && !search.trim() && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-3xl border px-6 py-12 text-center shadow-sm"
            style={{ borderColor: `${ap.primary}22`, background: `${ap.primary}08` }}
            role="status"
            aria-live="polite"
          >
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg ring-1 ring-black/10 dark:ring-white/15"
              style={{ background: `linear-gradient(140deg, ${ap.primary} 0%, ${ap.secondary} 140%)` }}
            >
              {isCatalog ? <Package className="h-7 w-7" /> : <UtensilsCrossed className="h-7 w-7" />}
            </span>
            <div>
              <p className={`text-[15px] font-extrabold tracking-tight ${titleCls(ap.titleFont)}`} style={{ color: ap.primary }}>
                {isCatalog ? "Catálogo en preparación" : "Carta en preparación"}
              </p>
              <p className="mx-auto mt-1.5 max-w-[26ch] text-[12.5px] leading-relaxed opacity-55">
                {preview
                  ? isCatalog
                    ? "Todavía no hay productos visibles. Agregá productos desde el editor del catálogo y aparecen acá al instante."
                    : "Todavía no hay platos visibles. Agregá platos desde el editor del menú y aparecen acá al instante."
                  : isCatalog
                    ? "Este negocio aún no publicó productos. Volvé pronto."
                    : "Este local aún no publicó platos. Volvé pronto."}
              </p>
            </div>
            <span
              className="rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
              style={{ background: ap.secondary }}
            >
              Muy pronto
            </span>
          </div>
        )}

        {available.length > 0 && filtered.length === 0 && search.trim() && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-black/10 px-6 py-12 text-center dark:border-white/10">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
              <Search className="h-6 w-6 opacity-40" />
            </span>
            <div>
              <p className="text-[14px] font-bold">Sin resultados</p>
              <p className="mt-1 text-[12px] opacity-50">No encontramos &ldquo;{search}&rdquo;</p>
            </div>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-1 min-h-[40px] cursor-pointer rounded-full px-5 py-2 text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: ap.primary }}
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

      {/* Footer: solo en página pública del menú (el catálogo no lo lleva,
          igual que el menú digital Plato; en preview lo reemplazan
          los botones Visitar/Compartir de CartaPhonePreview) */}
      {!preview && !isCatalog && <Footer slug={slug} primary={ap.primary} linkBase={base} />}

      {/* Barra flotante del pedido (solo catálogo): link al checkout */}
      {showCart && count > 0 && (
        <Link
          href={`/catalogo/${slug}/checkout`}
          aria-label={`Ver pedido, ${count} producto${count === 1 ? "" : "s"}`}
          className="fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-[548px] cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90"
          style={{ background: ap.primary }}
        >
          <ShoppingBag className="h-5 w-5" />
          Ver pedido, {count} producto{count === 1 ? "" : "s"}
        </Link>
      )}
    </main>
  );
}

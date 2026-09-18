"use client";

import { useMemo, useState } from "react";
import { Clock, Copy, Info, Search, Share, UtensilsCrossed, X } from "lucide-react";
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
   soporta varios slots por día + slots nocturnos (cierre < apertura). */
function computeScheduleStatus(
  schedule?: WeekSchedule,
  now: Date = new Date(),
): { open: boolean; label: string; timeLabel: string } | null {
  if (!schedule) return null;
  const dayIndex = (now.getDay() + 6) % 7; // 0=Mon
  const todayKey = DAY_MAP[dayIndex];
  const today = schedule.days[todayKey];
  if (!today?.enabled || today.slots.length === 0) {
    return { open: false, label: "Cerrado hoy", timeLabel: "" };
  }
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
    return { open: false, label: "Cerrado", timeLabel: `Abre a las ${next.open}` };
  }
  return { open: false, label: "Cerrado", timeLabel: "" };
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
            <Share className="h-4 w-4 opacity-60" />
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
/*  Franja decorativa — identidad Mar Digital (primary → secondary)   */
/*  Gradiente multicapa + realces radiales para que no se vea plana  */
/*  en 375px. NO usa naranja PlatoRest.                               */
/* ------------------------------------------------------------------ */
function DecorativeBar({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div
      className="relative flex items-center justify-center gap-2 overflow-hidden py-3"
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 130%), ${primary}`,
      }}
      aria-hidden="true"
    >
      {/* realce superior sutil */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -30%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%), radial-gradient(80% 100% at 85% 120%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)",
        }}
      />
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-[1px]">
        <UtensilsCrossed className="h-4 w-4 text-white" />
      </span>
      <span className="relative h-px w-10 rounded-full bg-white/40" />
      <span className="relative h-1 w-1 rounded-full bg-white/60" />
      <span className="relative h-px w-10 rounded-full bg-white/40" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Banda de estado — identidad Mar Digital. Abierto = emerald,        */
/*  cerrado = primary del local (nunca naranja PlatoRest).             */
/* ------------------------------------------------------------------ */
function StatusBand({ status, primary }: { status: { open: boolean; label: string; timeLabel: string }; primary: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors duration-500"
      style={{ background: status.open ? "#059669" : primary }}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span>
        {status.label}
        {status.timeLabel ? ` — ${status.timeLabel}` : ""}
      </span>
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
}: {
  restaurantName: string;
  logoUrl: string;
  primary: string;
  secondary: string;
  titleFont: RestaurantAppearance["titleFont"];
}) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-4">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-lg ring-1 ring-black/10 dark:ring-white/15" />
      ) : (
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold tracking-tight text-white shadow-lg ring-1 ring-black/10 dark:ring-white/15"
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
          Carta digital
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
function Footer({ slug, primary }: { slug?: string; primary: string }) {
  const url = slug ? `miseby.com/menu/${slug}` : "miseby.com/menu";
  function copyLink() {
    const full = slug ? `${window.location.origin}/menu/${slug}` : window.location.href;
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
 * Vista mobile pura de la carta al estilo PlatoRest.
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
}) {
  const [search, setSearch] = useState("");
  const displayRestaurantName = restaurantName || ap.restaurantName || "";
  const displayLogoUrl = ap.logoUrl || "";
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

  function handleShare() {
    const url = slug ? `${window.location.origin}/menu/${slug}` : window.location.href;
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

      {/* Franja decorativa */}
      <DecorativeBar primary={ap.primary} secondary={ap.secondary} />

      {/* Banda de estado */}
      {scheduleStatus && <StatusBand status={scheduleStatus} primary={ap.primary} />}
      {!scheduleStatus && hoursFallback && <StatusBand status={hoursFallback} primary={ap.primary} />}

      {/* Header local */}
      <LocalHeader
        restaurantName={displayRestaurantName}
        logoUrl={displayLogoUrl}
        primary={ap.primary}
        secondary={ap.secondary}
        titleFont={ap.titleFont}
      />

      {/* Barra de búsqueda sticky */}
      <SearchBar value={search} onChange={setSearch} background={ap.background} />

      {/* Lista de categorías y productos */}
      <div className="flex-1 space-y-5 px-4 pb-4">
        {cats.map((c) => {
          const prods = byCat(c.id);
          if (prods.length === 0 && search.trim()) return null;
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
              ) : (
                <div className="divide-y" style={{ borderColor: `${ap.primary}15` }}>
                  {prods.map((p) => {
                    const multi = (p.variants?.length ?? 0) > 1;
                    return (
                      <div key={p.id} className="flex items-start justify-between gap-3 py-3 transition-colors duration-200 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          {ap.showImages && p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                          ) : null}
                          <div className="min-w-0">
                            <p className={`text-[14px] font-semibold leading-snug ${titleCls(ap.titleFont)}`}>{p.name}</p>
                            {ap.showDescriptions && p.description ? (
                              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed opacity-60">{p.description}</p>
                            ) : null}
                            {multi ? <p className="mt-0.5 text-[11px] opacity-40">{p.variants!.length} opciones</p> : null}
                          </div>
                        </div>
                        {ap.showPrices ? (
                          <span
                            className="mt-0.5 shrink-0 rounded-full px-3 py-1 text-[12px] font-bold tabular-nums text-white"
                            style={{ background: ap.secondary }}
                          >
                            {multi ? `Desde ${formatPrice(productMinPrice(p), currency ?? "COP")}` : formatPrice(productMinPrice(p), currency ?? "COP")}
                          </span>
                        ) : null}
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
              <UtensilsCrossed className="h-7 w-7" />
            </span>
            <div>
              <p className={`text-[15px] font-extrabold tracking-tight ${titleCls(ap.titleFont)}`} style={{ color: ap.primary }}>
                Carta en preparación
              </p>
              <p className="mx-auto mt-1.5 max-w-[26ch] text-[12.5px] leading-relaxed opacity-55">
                {preview
                  ? "Todavía no hay platos visibles. Agregá platos desde el editor del menú y aparecen acá al instante."
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

      {/* Footer */}
      <Footer slug={slug} primary={ap.primary} />
    </main>
  );
}

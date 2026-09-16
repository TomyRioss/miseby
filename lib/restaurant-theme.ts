export type RestaurantCategory = { id: string; name: string; order: number };
export type RestaurantVariant = {
  id: string;
  name: string;
  price: number;
  costPrice?: number | null;
  packagingPrice?: number | null;
  sku?: string | null;
  isDefault: boolean;
};
export type RestaurantModifier = { id: string; name: string; price: number };
export type RestaurantModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  modifiers: RestaurantModifier[];
};
export type RestaurantProduct = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  available: boolean;
  imageUrl?: string | null;
  takeAway?: boolean;
  variants?: RestaurantVariant[];
  modifierGroups?: RestaurantModifierGroup[];
};
export type RestaurantAppearance = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  titleFont: "sans" | "serif" | "mono" | "round";
  bodyFont: "sans" | "serif" | "mono" | "round";
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
};
export type RestaurantIa = { isActive: boolean; whatToRecommend?: string; customInstructions?: string };
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type TimeSlot = { open: string; close: string };
export type DaySchedule = { enabled: boolean; slots: TimeSlot[] };
export type WeekSchedule = { timezone: string; days: Record<DayKey, DaySchedule> };
export type RestaurantData = {
  appearance?: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  ia?: RestaurantIa;
  hours?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
  schedule?: WeekSchedule;
  menuPublished?: boolean;
};

export const RESTAURANT_DEFAULT_APPEARANCE: RestaurantAppearance = {
  primary: "#0A2540",
  secondary: "#6D28D9",
  background: "#FFFFFF",
  text: "#171717",
  titleFont: "sans",
  bodyFont: "sans",
  showPrices: true,
  showImages: true,
  showDescriptions: true,
};

function normalizeVariant(v: unknown, idx: number): RestaurantVariant {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    id: typeof o.id === "string" && o.id ? o.id : newId("var"),
    name: typeof o.name === "string" && o.name ? o.name.slice(0, 60) : idx === 0 ? "Único" : `Opción ${idx + 1}`,
    price: typeof o.price === "number" && Number.isFinite(o.price) ? Math.max(0, o.price) : 0,
    costPrice: typeof o.costPrice === "number" && Number.isFinite(o.costPrice) ? o.costPrice : null,
    packagingPrice: typeof o.packagingPrice === "number" && Number.isFinite(o.packagingPrice) ? o.packagingPrice : null,
    sku: typeof o.sku === "string" ? o.sku.slice(0, 64) : null,
    isDefault: idx === 0 ? true : o.isDefault === true,
  };
}

function normalizeModifierGroup(g: unknown): RestaurantModifierGroup {
  const o = (g ?? {}) as Record<string, unknown>;
  const mods = Array.isArray(o.modifiers) ? o.modifiers : [];
  return {
    id: typeof o.id === "string" && o.id ? o.id : newId("grp"),
    name: typeof o.name === "string" ? o.name.slice(0, 60) : "Agregados",
    required: o.required === true,
    multiple: o.multiple !== false,
    modifiers: mods.slice(0, 50).map((m, i) => {
      const mo = (m ?? {}) as Record<string, unknown>;
      return {
        id: typeof mo.id === "string" && mo.id ? mo.id : newId("mod"),
        name: typeof mo.name === "string" ? mo.name.slice(0, 60) : `Opción ${i + 1}`,
        price: typeof mo.price === "number" && Number.isFinite(mo.price) ? Math.max(0, mo.price) : 0,
      };
    }),
  };
}

export function normalizeRestaurantProduct(p: unknown): RestaurantProduct {
  const o = (p ?? {}) as Record<string, unknown>;
  const price = typeof o.price === "number" && Number.isFinite(o.price) ? Math.max(0, o.price) : 0;
  const rawVariants = Array.isArray(o.variants) ? (o.variants as unknown[]) : [];
  const variants = rawVariants.length > 0 ? rawVariants.slice(0, 20).map(normalizeVariant) : undefined;
  const rawGroups = Array.isArray(o.modifierGroups) ? (o.modifierGroups as unknown[]) : [];
  return {
    id: typeof o.id === "string" ? o.id : newId("prd"),
    categoryId: typeof o.categoryId === "string" ? o.categoryId : "",
    name: typeof o.name === "string" ? o.name.slice(0, 80) : "",
    description: typeof o.description === "string" ? o.description.slice(0, 240) : "",
    price,
    available: o.available !== false,
    imageUrl: typeof o.imageUrl === "string" && o.imageUrl ? o.imageUrl.slice(0, 2000) : null,
    takeAway: o.takeAway !== false,
    ...(variants ? { variants } : {}),
    ...(rawGroups.length > 0 ? { modifierGroups: rawGroups.slice(0, 20).map(normalizeModifierGroup) } : {}),
  };
}

/** Precio de referencia: variante default, primera, o base. */
export function productPrice(p: RestaurantProduct): number {
  const vs = p.variants ?? [];
  if (vs.length > 0) return vs.find((v) => v.isDefault)?.price ?? vs[0]?.price ?? p.price;
  return p.price;
}

/** Precio mínimo entre variantes (para "desde"). */
export function productMinPrice(p: RestaurantProduct): number {
  const vs = p.variants ?? [];
  if (vs.length > 1) return Math.min(...vs.map((v) => v.price));
  return productPrice(p);
}

export function getRestaurantData(theme: unknown): RestaurantData {
  const t = (theme ?? {}) as Record<string, unknown>;
  const r = (t.restaurant ?? {}) as RestaurantData;
  return {
    appearance: { ...RESTAURANT_DEFAULT_APPEARANCE, ...(r.appearance ?? {}) },
    categories: Array.isArray(r.categories) ? (r.categories as RestaurantCategory[]) : [],
    products: Array.isArray(r.products) ? (r.products as unknown[]).map(normalizeRestaurantProduct) : [],
    ia: { isActive: false, whatToRecommend: "", customInstructions: "", ...(r.ia ?? {}) },
    hours: typeof r.hours === "string" ? r.hours : "",
    whatsapp: typeof r.whatsapp === "string" ? r.whatsapp : "",
    instagram: typeof r.instagram === "string" ? r.instagram : "",
    facebook: typeof r.facebook === "string" ? r.facebook : "",
    tiktok: typeof r.tiktok === "string" ? r.tiktok : "",
    x: typeof r.x === "string" ? r.x : "",
    schedule: parseSchedule(r.schedule),
    menuPublished: r.menuPublished === true,
  };
}

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};
export const DAY_SHORT: Record<DayKey, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
};

export const DEFAULT_TIMEZONE = "America/Bogota";
export const TIMEZONE_OPTIONS = [
  "America/Bogota",
  "America/Argentina/Buenos_Aires",
  "America/Lima",
  "America/Santiago",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/New_York",
  "Europe/Madrid",
];

export function timeOptions(stepMin = 30): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
}

function defaultDay(enabled: boolean): DaySchedule {
  return { enabled, slots: [{ open: "09:00", close: "18:00" }] };
}

export function defaultSchedule(timezone = DEFAULT_TIMEZONE): WeekSchedule {
  return {
    timezone,
    days: {
      mon: defaultDay(true),
      tue: defaultDay(true),
      wed: defaultDay(true),
      thu: defaultDay(true),
      fri: defaultDay(true),
      sat: defaultDay(false),
      sun: defaultDay(false),
    },
  };
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseSchedule(value: unknown): WeekSchedule {
  const fallback = defaultSchedule(
    typeof (value as WeekSchedule | null)?.timezone === "string" &&
      ((value as WeekSchedule).timezone as string).length > 0
      ? ((value as WeekSchedule).timezone as string)
      : DEFAULT_TIMEZONE,
  );
  if (!value || typeof value !== "object") return fallback;
  const v = value as Partial<WeekSchedule>;
  const days = { ...fallback.days };
  const rawDays = (v.days ?? {}) as Partial<Record<DayKey, Partial<DaySchedule>>>;
  for (const k of DAY_KEYS) {
    const d = rawDays[k];
    if (!d || typeof d !== "object") continue;
    const slots = Array.isArray(d.slots)
      ? d.slots
          .filter((s) => s && TIME_RE.test(s.open ?? "") && TIME_RE.test(s.close ?? ""))
          .slice(0, 3)
          .map((s) => ({ open: s.open, close: s.close }))
      : [];
    days[k] = {
      enabled: d.enabled === true && slots.length > 0,
      slots: slots.length > 0 ? slots : [{ open: "09:00", close: "18:00" }],
    };
  }
  return { timezone: typeof v.timezone === "string" && v.timezone ? v.timezone : fallback.timezone, days };
}

export function formatScheduleToText(s: WeekSchedule): string {
  const parts: string[] = [];
  for (const k of DAY_KEYS) {
    const d = s.days[k];
    if (!d?.enabled) continue;
    const ranges = d.slots.map((slot) => `${slot.open}–${slot.close}`).join(" y ");
    parts.push(`${DAY_SHORT[k]} ${ranges}`);
  }
  if (parts.length === 0) return "Cerrado temporalmente";
  return parts.join(" · ");
}

export function scheduleSummary(s: WeekSchedule): string {
  const open = DAY_KEYS.filter((k) => s.days[k]?.enabled);
  if (open.length === 0) return "Cerrado temporalmente";
  if (open.length === 7) {
    const first = s.days.mon.slots[0];
    const same = open.every(
      (k) => s.days[k].slots.length === 1 && s.days[k].slots[0].open === first.open && s.days[k].slots[0].close === first.close,
    );
    if (same) return `Lun–Dom · ${first.open}–${first.close}`;
  }
  return formatScheduleToText(s);
}

export function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatPrice(price: number, currency = "COP") {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `$${price}`;
  }
}

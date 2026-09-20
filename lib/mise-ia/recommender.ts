import type { RestaurantCategory, RestaurantProduct } from "@/lib/restaurant-theme";

export type DishCard = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  url: string;
  category: string;
};

export type RecommenderCtx = {
  products: RestaurantProduct[];
  categories: RestaurantCategory[];
  focus: string;
  tone: string;
  businessName: string;
};

export type RecommendResult = { reply: string; dishes: DishCard[] };

type Intent = "light" | "sweet" | "deal" | "default";

const LIGHT_KEYS = ["liviano", "light", "ensalada", "ensaladas", "dieta", "diet", "sin fritura", "saludable", "veggie", "vegetariano", "fresco"];
const SWEET_KEYS = ["postre", "postres", "dulce", "dulces", "torta", "helado", "flan", "chocolate", "brownie"];
const DEAL_KEYS = ["precio", "barato", "barata", "economico", "promo", "promocion", "oferta", "para 2", "para dos", "compartir", "llevar", "delivery"];

const STOPWORDS = new Set([
  "que", "una", "uno", "los", "las", "del", "con", "para", "por", "algo", "quiero", "hola", "buenas", "tienen", "tiene", "menu", "carta", "recomiendan", "recomiendame", "recomendame", "dame", "esta", "este", "esto",
]);

export function normalizeText(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function detectIntent(q: string): Intent {
  if (LIGHT_KEYS.some((k) => q.includes(k))) return "light";
  if (SWEET_KEYS.some((k) => q.includes(k))) return "sweet";
  if (DEAL_KEYS.some((k) => q.includes(k))) return "deal";
  return "default";
}

function queryKeywords(q: string): string[] {
  return normalizeText(q)
    .split(/[^a-z0-9]+/g)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function scoreProduct(
  p: RestaurantProduct,
  catName: string,
  keywords: string[],
  intent: Intent,
  focusNorm: string,
): number {
  const hay = normalizeText(`${p.name} ${p.description ?? ""} ${catName}`);
  let score = 0;
  for (const kw of keywords) {
    if (normalizeText(p.name).includes(kw)) score += 3;
    else if (hay.includes(kw)) score += 1;
  }
  if (intent === "light") {
    if (LIGHT_KEYS.some((k) => hay.includes(k))) score += 5;
    if (/frit|milanesa|hamburguesa|pizza/.test(hay)) score -= 2;
  } else if (intent === "sweet") {
    if (SWEET_KEYS.some((k) => hay.includes(k))) score += 5;
  } else if (intent === "deal") {
    if (DEAL_KEYS.some((k) => hay.includes(k))) score += 2;
    if (p.price > 0 && p.price <= 8000) score += 2;
    else if (p.price > 0 && p.price <= 15000) score += 1;
  }
  if (focusNorm) {
    const focusWords = focusNorm.split(/[^a-z0-9]+/g).filter((w) => w.length > 2);
    for (const fw of focusWords) {
      if (hay.includes(fw)) score += 4;
    }
  }
  return score;
}

function buildReply(names: string[], intent: Intent, businessName: string): string {
  const place = businessName ? ` en ${businessName}` : "";
  if (names.length === 0) {
    return `Mirá lo mejor de la carta${place}: te dejo algunos destacados acá abajo.`;
  }
  const listed = names.map((n) => `el ${n}`).join(", ").replace(/, ([^,]*)$/, " y $1");
  if (intent === "light") return `Para algo liviano te recomiendo ${listed}${place}. ¿Te tiento con alguno?`;
  if (intent === "sweet") return `Para lo dulce, no fallan ${listed}${place}. ¿Te guardo lugar para el postre?`;
  if (intent === "deal") return `Si buscás precio cumplidor, andá por ${listed}${place}. Rinden un montón.`;
  return `Te recomiendo ${listed}${place}. Son de los más pedidos.`;
}

export function recommendDishes(query: string, ctx: RecommenderCtx): RecommendResult {
  const products = (ctx.products ?? []).filter((p) => p.available);
  const catById = new Map((ctx.categories ?? []).map((c) => [c.id, c.name]));
  const q = normalizeText(query);
  const intent = detectIntent(q);
  const keywords = queryKeywords(query);
  const focusNorm = normalizeText(ctx.focus ?? "");

  let ranked = products
    .map((p) => ({
      p,
      cat: catById.get(p.categoryId) ?? "",
      score: scoreProduct(p, catById.get(p.categoryId) ?? "", keywords, intent, focusNorm),
    }))
    .sort((a, b) => b.score - a.score || a.p.price - b.p.price);

  if (ranked.length > 0 && ranked[0].score <= 0) {
    ranked = [...ranked].sort((a, b) => a.p.price - b.p.price);
  }

  const top = ranked.slice(0, 3);
  const dishes: DishCard[] = top.map(({ p, cat }) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl ?? null,
    url: "",
    category: cat,
  }));

  const reply = buildReply(
    top.map(({ p }) => p.name).slice(0, 3),
    intent,
    ctx.businessName ?? "",
  );

  return { reply, dishes };
}

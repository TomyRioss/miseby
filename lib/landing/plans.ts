export type PlanSlug = "mise-link" | "mise" | "mise-restaurant";

export interface LandingPlan {
  slug: PlanSlug;
  code: "mise_link" | "mise" | "mise_restaurant";
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  priceLabel: string;
  priceNote: string;
  href: string;
  accent: string;
  features: { title: string; detail: string }[];
}

export const PLACEHOLDER_PRICE = "$10.000 COP";

export const PLANS: LandingPlan[] = [
  {
    slug: "mise-link",
    code: "mise_link",
    name: "Mise Link",
    shortName: "Link",
    tagline: "Tu tarjeta digital en un solo link",
    description:
      "Una página pública en miseby.com/@tunegocio con tus links, redes y contacto. Ideal para emprendedores y creadores que quieren compartirlo todo desde un único enlace.",
    priceLabel: PLACEHOLDER_PRICE,
    priceNote: "Precio de lanzamiento",
    href: "/planes/mise-link",
    accent: "#0E88E2",
    features: [
      { title: "Página pública @tunegocio", detail: "Tu dirección propia dentro de miseby.com, lista para compartir." },
      { title: "Links y redes sociales", detail: "WhatsApp, Instagram, web y todo lo que quieras destacar." },
      { title: "Foto, bio y temas visuales", detail: "Avatar, descripción y estilos para que se vea como tu marca." },
      { title: "Código QR para compartir", detail: "Un QR que lleva directo a tu página, ideal para impresos y local." },
      { title: "Vista previa antes de publicar", detail: "Revisa cómo se ve tu página y publícala cuando esté lista." },
    ],
  },
  {
    slug: "mise",
    code: "mise",
    name: "Mise",
    shortName: "Mise",
    tagline: "Tu negocio completo en internet",
    description:
      "Presencia digital integral: perfil del negocio, catálogo de productos, clientes, analíticas y el asistente Mise IA. Para negocios que quieren vender y organizarse en un solo panel.",
    priceLabel: PLACEHOLDER_PRICE,
    priceNote: "Precio de lanzamiento",
    href: "/planes/mise",
    accent: "#075296",
    features: [
      { title: "Perfil del negocio", detail: "Información, contacto y apariencia personalizable de tu marca." },
      { title: "Catálogo de productos", detail: "Productos y categorías organizados en un catálogo digital." },
      { title: "Gestión de clientes", detail: "Tus clientes registrados y ordenados en un solo lugar." },
      { title: "Analíticas y estadísticas", detail: "Métricas para entender visitas y rendimiento de tu página." },
      { title: "Asistente Mise IA", detail: "Ayuda inteligente para trabajar más rápido en tu panel." },
    ],
  },
  {
    slug: "mise-restaurant",
    code: "mise_restaurant",
    name: "Mise Restaurant",
    shortName: "Restaurant",
    tagline: "Tu menú digital con QR para mesas",
    description:
      "Menú digital pensado para restaurantes y cafés: secciones, platos con variantes y agregados, horarios y QR para cada mesa. Tus clientes ven la carta desde el celular.",
    priceLabel: PLACEHOLDER_PRICE,
    priceNote: "Precio de lanzamiento",
    href: "/planes/mise-restaurant",
    accent: "#1FD0FF",
    features: [
      { title: "Menú digital con QR", detail: "Carta accesible desde el celular con códigos QR para mesas." },
      { title: "Secciones y categorías", detail: "Organiza tu carta por entradas, fuertes, bebidas y más." },
      { title: "Platos con variantes y agregados", detail: "Tamaños, acompañamientos y extras configurables por plato." },
      { title: "Horarios y disponibilidad", detail: "Define horarios de atención y qué se muestra en cada momento." },
      { title: "Precios en tu moneda", detail: "Carta con los precios de tu negocio, siempre actualizada." },
    ],
  },
];

export function getPlan(slug: string): LandingPlan | undefined {
  return PLANS.find((p) => p.slug === slug);
}

export const PLAN_SLUG_TO_CODE = {
  "mise-link": "mise_link",
  "mise": "mise",
  "mise-restaurant": "mise_restaurant",
} as const;

export function planSlugToCode(slug: PlanSlug): "mise_link" | "mise" | "mise_restaurant" {
  return PLAN_SLUG_TO_CODE[slug];
}

export function isPlanSlug(value: string | undefined): value is PlanSlug {
  return value === "mise-link" || value === "mise" || value === "mise-restaurant";
}

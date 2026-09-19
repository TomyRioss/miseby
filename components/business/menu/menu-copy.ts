/**
 * Textos del editor de menú/catálogo.
 * El plan MISE RESTAURANT usa copia gastronómica ("plato", "carta");
 * el plan MISE general usa copia neutra multirubro ("producto", "catálogo").
 * Los componentes comparten implementación y solo cambian estos textos.
 */
export type MenuCopy = {
  itemSingular: string;
  itemPlural: string;
  itemCap: string;
  itemExample: string;
  descPlaceholder: string;
  menuNoun: string;
  menuNounCap: string;
  businessWord: string;
  businessFallback: string;
  linkBase: string;
  variantsHint: string;
  groupsHint: string;
  sectionExample: string;
  sectionPlaceholder: string;
  takeAwayLabel: string;
  takeAwayWord: string;
  templates: { name: string; desc: string }[];
  steps: { num: number; title: string; desc: string }[];
};

export const MENU_COPY_RESTAURANT: MenuCopy = {
  itemSingular: "plato",
  itemPlural: "platos",
  itemCap: "Plato",
  itemExample: "Bandeja paisa",
  descPlaceholder: "Qué trae, en una línea que antoje",
  menuNoun: "carta",
  menuNounCap: "Carta",
  businessWord: "Restaurante",
  businessFallback: "Tu restaurante",
  linkBase: "menu",
  variantsHint: "Tamaños, términos, porciones...",
  groupsHint: "Ej: Término de la carne, Adiciones, Salsas.",
  sectionExample: "Postres",
  sectionPlaceholder: "Ej: Postres, Bebidas, Especiales…",
  takeAwayLabel: "Disponible para llevar",
  takeAwayWord: "Llevar",
  templates: [
    { name: "Entradas", desc: "Tapas, picadas" },
    { name: "Fuertes", desc: "Platos principales" },
    { name: "Postres", desc: "Dulces y más" },
    { name: "Bebidas", desc: "Líquidos y cócteles" },
  ],
  steps: [
    { num: 1, title: "Creá una sección", desc: "Ej: Entradas, Fuertes, Postres… Organizá tu carta en grupos." },
    { num: 2, title: "Agregá platos con precios", desc: "Dale nombre, precio y descripción a cada plato de la sección." },
    { num: 3, title: "Publicá tu carta", desc: "Cuando estén listos, publicala y compartila con tus clientes." },
  ],
};

export const MENU_COPY_CATALOG: MenuCopy = {
  itemSingular: "producto",
  itemPlural: "productos",
  itemCap: "Producto",
  itemExample: "Remera básica",
  descPlaceholder: "Describí tu producto en una línea",
  menuNoun: "catálogo",
  menuNounCap: "Catálogo",
  businessWord: "Negocio",
  businessFallback: "Tu negocio",
  linkBase: "catalogo",
  variantsHint: "Talles, tamaños, versiones...",
  groupsHint: "Ej: Color, Talle, Adicionales.",
  sectionExample: "Destacados",
  sectionPlaceholder: "Ej: Destacados, Novedades, Promos…",
  takeAwayLabel: "Disponible para entrega/retiro",
  takeAwayWord: "Entrega",
  templates: [
    { name: "Destacados", desc: "Lo más vendido" },
    { name: "Novedades", desc: "Lo último" },
    { name: "Promociones", desc: "Ofertas y combos" },
    { name: "Servicios", desc: "Lo que ofrecés" },
  ],
  steps: [
    { num: 1, title: "Creá una sección", desc: "Ej: Destacados, Novedades, Promos… Organizá tu catálogo en grupos." },
    { num: 2, title: "Agregá productos con precios", desc: "Dale nombre, precio y descripción a cada producto de la sección." },
    { num: 3, title: "Publicá tu catálogo", desc: "Cuando estén listos, publicalo y compartilo con tus clientes." },
  ],
};

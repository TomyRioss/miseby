"use client";

import { CheckoutView } from "@/components/checkout/checkout-view";

/** Checkout del pedido: carrito → datos → POST /api/orders. */
export function PlatoCheckoutView({
  slug,
  restaurantName,
  currency = "COP",
  whatsapp,
  primary = "#0A2540",
  secondary = "#6D28D9",
  background = "#FFFFFF",
  text = "#171717",
}: {
  slug: string;
  restaurantName: string;
  currency?: string | null;
  whatsapp?: string | null;
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
}) {
  return (
    <CheckoutView
      slug={slug}
      businessName={restaurantName}
      backHref={`/menu/${slug}`}
      backLabel="Volver al menú"
      emptyHint="Tu pedido está vacío. Volvé al menú y agregá algo rico."
      currency={currency}
      whatsapp={whatsapp}
      primary={primary}
      accent={secondary}
      background={background}
      text={text}
    />
  );
}

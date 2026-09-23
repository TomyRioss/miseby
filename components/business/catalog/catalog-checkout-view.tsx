"use client";

import { CheckoutView } from "@/components/checkout/checkout-view";

/** Checkout del pedido del catálogo multirubro: carrito → datos → POST /api/orders. */
export function CatalogCheckoutView({
  slug,
  businessName,
  currency = "COP",
  whatsapp,
  primary = "#0A2540",
  background = "#FFFFFF",
  text = "#171717",
}: {
  slug: string;
  businessName: string;
  currency?: string | null;
  whatsapp?: string | null;
  primary?: string;
  background?: string;
  text?: string;
}) {
  return (
    <CheckoutView
      slug={slug}
      businessName={businessName}
      backHref={`/catalogo/${slug}`}
      backLabel="Volver al catálogo"
      emptyHint="Tu pedido está vacío. Volvé al catálogo y agregá un producto."
      currency={currency}
      whatsapp={whatsapp}
      primary={primary}
      background={background}
      text={text}
    />
  );
}

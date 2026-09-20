import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCatalogBySlug } from "@/lib/services/catalog";
import { CatalogCheckoutView } from "@/components/business/catalog/catalog-checkout-view";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getPublicCatalogBySlug(slug).catch(() => null);
  const name = catalog?.data.appearance?.restaurantName || catalog?.commercialName || "Catálogo";
  return {
    title: `Tu pedido | ${name}`,
    robots: catalog?.preview ? { index: false, follow: false } : undefined,
  };
}

export default async function CatalogCheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getPublicCatalogBySlug(slug).catch((e) => {
    console.error("[public catalog checkout]", e);
    return null;
  });
  if (!catalog) notFound();
  const ap = catalog.data.appearance!;
  return (
    <CatalogCheckoutView
      slug={catalog.slug}
      businessName={ap.restaurantName || catalog.commercialName}
      currency={catalog.currency}
      whatsapp={catalog.data.whatsapp}
      primary={ap.primary}
      background={ap.background}
      text={ap.text}
    />
  );
}

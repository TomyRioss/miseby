import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCatalogBySlug } from "@/lib/services/catalog";
import { productMinPrice } from "@/lib/restaurant-theme";
import { CatalogPublicView } from "@/components/business/catalog/catalog-public-view";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getPublicCatalogBySlug(slug).catch(() => null);
  if (!catalog) return { title: "Catálogo no encontrado | MISE BY" };
  const name = catalog.data.appearance?.restaurantName || catalog.commercialName;
  return {
    title: `${name} | Catálogo`,
    description: `Catálogo de productos de ${name}.`,
    robots: catalog.preview ? { index: false, follow: false } : undefined,
  };
}

/** JSON-LD genérico multirubro: Store + ItemList (sin tipos gastronómicos). */
function jsonLd(catalog: NonNullable<Awaited<ReturnType<typeof getPublicCatalogBySlug>>>) {
  const available = (catalog.data.products ?? []).filter((p) => p.available);
  const cats = [...(catalog.data.categories ?? [])].sort((a, b) => a.order - b.order);
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: catalog.data.appearance?.restaurantName || catalog.commercialName,
    url: `/catalogo/${catalog.slug}`,
    itemListElement: cats.flatMap((c) =>
      available
        .filter((p) => p.categoryId === c.id)
        .map((p) => ({
          "@type": "Product",
          name: p.name,
          description: p.description || undefined,
          image: p.imageUrl || undefined,
          category: c.name,
          offers: {
            "@type": "Offer",
            price: productMinPrice(p),
            priceCurrency: catalog.currency ?? "COP",
            availability: "https://schema.org/InStock",
          },
        })),
    ),
  };
}

export default async function PublicCatalogPage({ params }: Params) {
  const { slug } = await params;
  const catalog = await getPublicCatalogBySlug(slug).catch((e) => {
    console.error("[public catalog]", e);
    return null;
  });
  if (!catalog) notFound();

  return (
    <div className="min-h-[100dvh] bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(catalog)) }}
      />
      <CatalogPublicView
        appearance={catalog.data.appearance!}
        categories={catalog.data.categories ?? []}
        products={catalog.data.products ?? []}
        currency={catalog.currency}
        hours={catalog.data.hours}
        preview={catalog.preview}
        businessName={catalog.data.appearance?.restaurantName || catalog.commercialName}
        slug={catalog.slug}
        schedule={catalog.data.schedule}
      />
    </div>
  );
}

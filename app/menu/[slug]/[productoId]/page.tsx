import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicMenuBySlug } from "@/lib/services/public-menu";
import { getPublicOrganizationBySlug } from "@/lib/services/public-organization";
import { OrganizationUnavailable } from "@/components/public/organization-unavailable";
import { ProductDetailView } from "@/components/menu/product-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productoId: string }>;
}): Promise<Metadata> {
  const { slug, productoId } = await params;
  const data = await getPublicMenuBySlug(slug).catch(() => null);
  const product = data?.rest.products?.find((p) => p.id === productoId);
  if (!data || !product) return { title: "Producto no encontrado | MISE BY" };
  const name = data.rest.appearance?.restaurantName || data.organization.commercialName;
  return { title: `${product.name} | ${name}`, robots: data?.preview ? { index: false, follow: false } : undefined };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productoId: string }>;
}) {
  const { slug, productoId } = await params;
  const gate = await getPublicOrganizationBySlug(slug).catch(() => null);
  if (gate && !gate.visible) {
    return <OrganizationUnavailable businessName={gate.organization.commercialName} />;
  }
  const data = await getPublicMenuBySlug(slug);
  if (!data) notFound();
  const product = data.rest.products?.find((p) => p.id === productoId);
  if (!product) notFound();
  return (
    <ProductDetailView
      product={product}
      currency={data.organization.currency}
      slug={data.organization.slug}
      appearance={data.rest.appearance!}
    />
  );
}

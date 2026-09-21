import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicMenuBySlug } from "@/lib/services/public-menu";
import { getPublicOrganizationBySlug } from "@/lib/services/public-organization";
import { OrganizationUnavailable } from "@/components/public/organization-unavailable";
import { PlatoCheckoutView } from "@/components/menu/plato-checkout-view";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const gate = await getPublicOrganizationBySlug(slug).catch(() => null);
  if (gate && !gate.visible) return { title: "En revisión | MISE BY" };
  const data = await getPublicMenuBySlug(slug);
  if (!data) return { title: "Pedido no encontrado | MISE BY" };
  const name = data.rest.appearance?.restaurantName || data.organization.commercialName || "Menú";
  return {
    title: `Tu pedido | ${name}`,
    robots: data?.preview ? { index: false, follow: false } : undefined,
  };
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gate = await getPublicOrganizationBySlug(slug).catch(() => null);
  if (gate && !gate.visible) {
    return <OrganizationUnavailable businessName={gate.organization.commercialName} />;
  }
  const data = await getPublicMenuBySlug(slug);
  if (!data) notFound();
  const { organization: org, rest } = data;
  const ap = rest.appearance!;
  return (
    <PlatoCheckoutView
      slug={org.slug}
      restaurantName={ap.restaurantName || org.commercialName}
      currency={org.currency}
      whatsapp={rest.whatsapp}
      primary={ap.primary}
      background={ap.background}
      text={ap.text}
    />
  );
}

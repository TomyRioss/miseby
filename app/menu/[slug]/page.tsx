import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicMenuBySlug } from "@/lib/services/public-menu";
import { getPublicOrganizationBySlug } from "@/lib/services/public-organization";
import { OrganizationUnavailable } from "@/components/public/organization-unavailable";
import { PlatoMenuView } from "@/components/menu/plato-menu-view";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const gate = await getPublicOrganizationBySlug(slug).catch(() => null);
  if (gate && !gate.visible) return { title: "En revisión | MISE BY" };
  const data = await getPublicMenuBySlug(slug);
  if (!data) return { title: "Menú no encontrado | MISE BY" };
  const name = data.rest.appearance?.restaurantName || data.organization.commercialName || "Menú";
  return {
    title: `${name} | Menú`,
    robots: data?.preview ? { index: false, follow: false } : undefined,
  };
}

export default async function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gate = await getPublicOrganizationBySlug(slug).catch(() => null);
  if (gate && !gate.visible) {
    return <OrganizationUnavailable businessName={gate.organization.commercialName} />;
  }
  const data = await getPublicMenuBySlug(slug);
  if (!data) notFound();
  const { organization: org, rest } = data;
  const ap = rest.appearance!;
  const restaurantName = ap.restaurantName || org.commercialName;

  const cats = (rest.categories ?? []).map((c) => ({ "@type": "MenuSection", name: c.name }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurantName,
    url: `/menu/${org.slug}`,
    ...(ap.logoUrl ? { logo: ap.logoUrl } : {}),
    ...(org.address ? { address: { "@type": "PostalAddress", streetAddress: org.address } } : {}),
    hasMenu: { "@type": "Menu", url: `/menu/${org.slug}`, hasMenuSection: cats },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PlatoMenuView
        appearance={ap}
        categories={rest.categories ?? []}
        products={rest.products ?? []}
        currency={org.currency}
        restaurantName={restaurantName}
        logoUrl={ap.logoUrl}
        whatsapp={rest.whatsapp}
        slug={org.slug}
        schedule={rest.schedule}
        hours={rest.hours}
        meseroActive={rest.ia?.isActive === true}
      />
    </>
  );
}

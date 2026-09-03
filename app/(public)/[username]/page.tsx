import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getPublicPageByUsername,
  getOwnPageByUsername,
  type MiseLinkPageWithRelations,
} from "@/lib/services/miselink";
import { MiseLinkPublicView } from "@/components/miselink/render/miselink-public-view";

type Params = { params: Promise<{ username: string }> };

async function resolvePage(username: string): Promise<{
  page: MiseLinkPageWithRelations;
  preview: boolean;
} | null> {
  const published = await getPublicPageByUsername(username);
  if (published) return { page: published, preview: false };

  const user = await getCurrentUser();
  if (!user) return null;
  const own = await getOwnPageByUsername(user.id, username);
  if (own) return { page: own, preview: true };
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const resolved = await resolvePage(username).catch(() => null);
  if (!resolved) return { title: "Página no encontrada — MISE BY" };
  const { page } = resolved;
  const title = page.displayName?.trim() || `@${page.username}`;
  return {
    title: `${title} — MISE BY`,
    description: page.bio?.trim() || undefined,
    robots: resolved.preview ? { index: false, follow: false } : undefined,
  };
}

export default async function MiseLinkPublicPage({ params }: Params) {
  const { username } = await params;
  const resolved = await resolvePage(username);
  if (!resolved) notFound();

  const { page, preview } = resolved;
  const activeItems = preview ? page.items.filter((i) => i.active) : page.items;

  return (
    <div className="min-h-[100dvh] bg-background">
      {preview ? (
        <p className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Vista previa — esta página todavía no está publicada.
        </p>
      ) : null}
      <MiseLinkPublicView
        page={{
          username: page.username,
          displayName: page.displayName,
          bio: page.bio,
          avatarUrl: page.avatarUrl,
        }}
        items={activeItems.map((i) => ({ id: i.id, title: i.title, url: i.url }))}
        socials={page.socials.map((s) => ({ id: s.id, network: s.network, url: s.url }))}
      />
    </div>
  );
}

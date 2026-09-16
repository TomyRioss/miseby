"use client";

import { PhonePreviewShell } from "@/components/shared/phone-preview-shell";
import { MiseLinkPublicView } from "./miselink-public-view";

export type PhonePreviewPage = {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type PhonePreviewItem = { id: string; title: string | null; url: string | null };
export type PhonePreviewSocial = { id: string; network: string; url: string };

/**
 * Preview mobile único de MiseLink. Mismo exacto en Links, Diseño y
 * donde se necesite: pill de URL + teléfono sin scroll (overflow-hidden).
 * El padre define la altura (el marco ocupa h-full).
 */
export function MiseLinkPhonePreview({
  username,
  page,
  items,
  socials,
  theme,
  onShare,
}: {
  username: string;
  page: PhonePreviewPage;
  items: PhonePreviewItem[];
  socials: PhonePreviewSocial[];
  theme?: unknown;
  onShare?: () => void;
}) {
  return (
    <PhonePreviewShell urlLabel={`miseby.com/${username}`} onShare={onShare} shareTitle="Compartir enlace">
      <MiseLinkPublicView
        preview
        page={{ username, ...page }}
        items={items}
        socials={socials}
        theme={theme}
      />
    </PhonePreviewShell>
  );
}

"use client";

import { FiShare } from "react-icons/fi";
import { MiseLinkPublicView } from "@/components/miselink/render/miselink-public-view";
import type { MiseLinkTheme } from "@/lib/miselink/theme";

export function DesignPreview({
  username,
  page,
  items,
  socials,
  theme,
}: {
  username: string;
  page: { displayName: string | null; bio: string | null; avatarUrl: string | null };
  items: { id: string; title: string | null; url: string | null }[];
  socials: { id: string; network: string; url: string }[];
  theme: MiseLinkTheme;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
        <span className="flex-1 truncate text-center text-sm text-muted-foreground">
          miseby.com/{username}
        </span>
        <FiShare className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="overflow-hidden rounded-[28px] border border-border shadow-sm">
        <div className="h-[620px] max-h-[70vh] overflow-hidden">
          <MiseLinkPublicView
            preview
            page={{ username, ...page }}
            items={items}
            socials={socials}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}

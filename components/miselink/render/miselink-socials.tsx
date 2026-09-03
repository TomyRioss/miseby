import { MISELINK_SOCIAL_NETWORKS } from "@/lib/miselink/social-networks";
import type { SocialNetwork } from "@/lib/validations/miselink";
import type { RenderSocial } from "./types";

export function MiseLinkSocials({ socials }: { socials: RenderSocial[] }) {
  if (socials.length === 0) return null;
  return (
    <nav className="flex flex-wrap items-center justify-center gap-4">
      {socials.map((s) => {
        const meta = MISELINK_SOCIAL_NETWORKS[s.network as SocialNetwork];
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={meta.label}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </nav>
  );
}

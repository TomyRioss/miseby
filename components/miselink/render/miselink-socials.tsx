import type { RenderSocial } from "./types";
import { MISELINK_SOCIAL_NETWORKS } from "@/lib/miselink/social-networks";
import type { SocialNetwork } from "@/lib/validations/miselink";
import type { MiseLinkTheme } from "@/lib/miselink/theme";

export function MiseLinkSocials({ socials, theme }: { socials: RenderSocial[]; theme?: MiseLinkTheme }) {
  if (socials.length === 0) return null;
  return (
    <nav aria-label="Redes sociales" className="flex flex-wrap items-center justify-center gap-5 pt-1">
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
            style={{ color: theme?.colors.text ?? "#171717" }}
            className="cursor-pointer flex h-11 w-11 items-center justify-center transition-transform hover:scale-105 active:scale-95"
          >
            <Icon className="h-7 w-7" />
          </a>
        );
      })}
    </nav>
  );
}

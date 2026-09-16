import { MiseLinkHeader } from "./miselink-header";
import { MiseLinkSocials } from "./miselink-socials";
import { MiseLinkButton } from "./miselink-button";
import { MiseLinkTopbar } from "./miselink-topbar";
import { MiseLinkFooter } from "./miselink-footer";
import type { RenderPage, RenderItem, RenderSocial } from "./types";
import { normalizeTheme, themeBackground, themeFontClass, type MiseLinkTheme } from "@/lib/miselink/theme";

export function MiseLinkPublicView({
  page,
  items,
  socials,
  theme: themeRaw,
  preview = false,
  showOptions = true,
}: {
  page: RenderPage;
  items: RenderItem[];
  socials: RenderSocial[];
  theme?: unknown;
  preview?: boolean;
  showOptions?: boolean;
}) {
  const theme: MiseLinkTheme = normalizeTheme(themeRaw);
  const hasBanner = theme.bannerVisible === true && !!theme.bannerImage;

  if (hasBanner) {
    return (
      <main
        style={{ background: themeBackground(theme), color: theme.colors.text }}
        className={
          preview
            ? `mx-auto flex min-h-full w-full max-w-[580px] flex-col items-center pb-6 ${themeFontClass(theme.font)}`
            : `mx-auto flex min-h-[100dvh] w-full max-w-[580px] flex-1 flex-col items-center pb-6 sm:-mb-12 sm:rounded-t-[24px] sm:shadow-[0_24px_64px_rgba(0,0,0,0.28)] ${themeFontClass(theme.font)}`
        }
      >
        <div className="relative w-full">
          <MiseLinkHeader page={page} theme={theme} />
          <div className="absolute inset-x-4 top-3 z-20 sm:inset-x-5">
            <MiseLinkTopbar
              username={page.username}
              avatarUrl={page.avatarUrl}
              displayName={page.displayName}
            />
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-5 px-5 pt-2 sm:px-8">
          <MiseLinkSocials socials={socials} theme={theme} />
          <div className="flex w-full flex-col gap-4 pt-2">
            {items.map((item) => (
              <MiseLinkButton key={item.id} item={item} theme={theme} showOptions={showOptions} />
            ))}
          </div>
        </div>
        <MiseLinkFooter theme={theme} />
      </main>
    );
  }
  return (
    <main
      style={{ background: themeBackground(theme), color: theme.colors.text }}
      className={
        preview
          ? `mx-auto flex min-h-full w-full max-w-[580px] flex-col items-center px-5 pb-6 pt-4 ${themeFontClass(theme.font)}`
          : `mx-auto flex min-h-[100dvh] w-full max-w-[580px] flex-1 flex-col items-center px-5 pb-6 pt-4 sm:-mb-12 sm:rounded-t-[24px] sm:px-8 sm:shadow-[0_24px_64px_rgba(0,0,0,0.28)] ${themeFontClass(theme.font)}`
      }
    >
      <MiseLinkTopbar
        username={page.username}
        avatarUrl={page.avatarUrl}
        displayName={page.displayName}
      />
      <div className="flex w-full flex-col items-center gap-5 pt-6">
        <MiseLinkHeader page={page} theme={theme} />
        <MiseLinkSocials socials={socials} theme={theme} />
        <div className="flex w-full flex-col gap-4 pt-2">
          {items.map((item) => (
            <MiseLinkButton key={item.id} item={item} theme={theme} showOptions={showOptions} />
          ))}
        </div>
      </div>
      <MiseLinkFooter theme={theme} />
    </main>
  );
}

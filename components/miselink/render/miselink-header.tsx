import { FaUser } from "react-icons/fa6";
import type { RenderPage } from "./types";
import type { MiseLinkTheme } from "@/lib/miselink/theme";

export function MiseLinkHeader({ page, theme }: { page: RenderPage; theme?: MiseLinkTheme }) {
  const handle = `@${page.username}`;
  const sub = page.bio?.trim() || page.displayName?.trim() || "";
  const variant = theme?.header ?? "classic";
  const fg = theme?.colors.text ?? "#171717";

  if (variant === "compact") {
    return (
      <header className="flex w-full items-center gap-3 text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/15">
          {page.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.avatarUrl} alt={handle} className="h-full w-full object-cover" />
          ) : (
            <FaUser className="h-5 w-5 text-white" aria-hidden />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[18px] font-extrabold leading-tight" style={{ color: fg }}>
            {handle}
          </h1>
          {sub ? (
            <p className="truncate text-[13px] font-medium opacity-80" style={{ color: fg }}>
              {sub}
            </p>
          ) : null}
        </div>
      </header>
    );
  }

  const avatarSize = variant === "hero" ? "h-28 w-28" : "h-24 w-24";
  const titleSize = variant === "hero" ? "text-[26px]" : "text-[22px]";

  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <div className={`flex ${avatarSize} items-center justify-center overflow-hidden rounded-full bg-black/15`}>
        {page.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.avatarUrl} alt={handle} className="h-full w-full object-cover" />
        ) : (
          <FaUser className="h-12 w-12 text-white" aria-hidden />
        )}
      </div>
      <h1 className={`${titleSize} font-extrabold leading-tight tracking-tight`} style={{ color: fg }}>
        {handle}
      </h1>
      {sub ? (
        <p className="text-[15px] font-medium opacity-90" style={{ color: fg }}>
          {sub}
        </p>
      ) : null}
    </header>
  );
}

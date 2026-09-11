import { FaUser } from "react-icons/fa6";
import type { RenderPage } from "./types";
import type { MiseLinkTheme } from "@/lib/miselink/theme";

function Avatar({
  handle,
  url,
  className,
  iconClass,
}: {
  handle: string;
  url: string | null;
  className: string;
  iconClass: string;
}) {
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-black/15 ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={handle} className="h-full w-full object-cover" />
      ) : (
        <FaUser className={`text-white ${iconClass}`} aria-hidden />
      )}
    </div>
  );
}

export function MiseLinkHeader({ page, theme }: { page: RenderPage; theme?: MiseLinkTheme }) {
  const handle = `@${page.username}`;
  const sub = page.bio?.trim() || page.displayName?.trim() || "";
  const variant = theme?.header ?? "classic";
  const fg = theme?.colors.text ?? "#171717";

  if (variant === "compact") {
    return (
      <header className="flex w-full items-center gap-3 text-left">
        <Avatar handle={handle} url={page.avatarUrl} className="h-12 w-12 shrink-0 rounded-full" iconClass="h-5 w-5" />
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

  if (variant === "banner") {
    return (
      <header className="flex w-full flex-col overflow-hidden rounded-2xl" style={{ background: "rgba(0,0,0,0.08)" }}>
        <div className="h-20 w-full" style={{ background: "rgba(0,0,0,0.18)" }} />
        <div className="-mt-8 flex flex-col items-center gap-2 px-4 pb-3 text-center">
          <Avatar handle={handle} url={page.avatarUrl} className="h-16 w-16 rounded-full ring-4 ring-white/60" iconClass="h-7 w-7" />
          <h1 className="text-[20px] font-extrabold leading-tight" style={{ color: fg }}>
            {handle}
          </h1>
          {sub ? (
            <p className="text-[14px] font-medium opacity-80" style={{ color: fg }}>
              {sub}
            </p>
          ) : null}
        </div>
      </header>
    );
  }

  if (variant === "cutout") {
    return (
      <header className="flex w-full items-center gap-4 text-left">
        <Avatar handle={handle} url={page.avatarUrl} className="h-20 w-16 shrink-0 rounded-[22px]" iconClass="h-7 w-7" />
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: fg }}>
            {handle}
          </h1>
          {sub ? (
            <p className="text-[14px] font-medium opacity-80" style={{ color: fg }}>
              {sub}
            </p>
          ) : null}
        </div>
      </header>
    );
  }

  if (variant === "shape") {
    return (
      <header className="flex flex-col items-center gap-3 text-center">
        <Avatar
          handle={handle}
          url={page.avatarUrl}
          className="h-24 w-28 rounded-[48%_52%_55%_45%/48%_45%_55%_52%]"
          iconClass="h-10 w-10"
        />
        <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: fg }}>
          {handle}
        </h1>
        {sub ? (
          <p className="max-w-[280px] text-[14px] font-medium opacity-80" style={{ color: fg }}>
            {sub}
          </p>
        ) : null}
      </header>
    );
  }

  const avatarSize = variant === "hero" ? "h-28 w-28 rounded-[28px]" : "h-24 w-24 rounded-full";
  const titleSize = variant === "hero" ? "text-[26px]" : "text-[22px]";

  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <Avatar handle={handle} url={page.avatarUrl} className={avatarSize} iconClass="h-12 w-12" />
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

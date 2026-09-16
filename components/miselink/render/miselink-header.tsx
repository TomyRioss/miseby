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
  const bannerVisible = theme?.bannerVisible === true && !!theme?.bannerImage;
  const bannerSrc = theme?.bannerImage || "";
  const meltColor =
    theme?.wallpaper === "gradient"
      ? (theme?.wallpaperGradient?.from ?? theme?.colors.background ?? "#f4f1ea")
      : (theme?.colors.background ?? "#f4f1ea");
  const fade =
    typeof theme?.bannerFade === "number" && Number.isFinite(theme.bannerFade)
      ? Math.min(100, Math.max(0, theme.bannerFade))
      : 75;
  const meltStart = 100 - fade;

  const bannerBlock = (
    <div className="relative aspect-[3/1] w-full overflow-hidden sm:rounded-t-[24px]">
      {bannerVisible ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerSrc}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div className="h-full w-full" style={{ background: "rgba(0,0,0,0.18)" }} />
      )}
      {/* Scrim superior: legibilidad del botón compartir */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 via-black/5 to-transparent" />
      {/* Melt inferior: funde el banner con el fondo, el avatar queda encima */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0) ${meltStart}%, ${meltColor} 100%)`,
        }}
      />
    </div>
  );

  if (variant === "compact") {
    if (bannerVisible) {
      return (
        <header className="flex w-full flex-col">
          {bannerBlock}
          <div className="relative z-10 flex w-full items-center gap-3 px-5 pb-3 text-left sm:px-8">
            <Avatar
              handle={handle}
              url={page.avatarUrl}
              className="-mt-14 h-20 w-20 shrink-0 rounded-full ring-4 ring-white shadow-xl"
              iconClass="h-7 w-7"
            />
            <div className="min-w-0 pt-10">
              <h1 className="truncate text-[18px] font-extrabold leading-tight" style={{ color: fg }}>
                {handle}
              </h1>
              {sub ? (
                <p className="truncate text-[13px] font-medium opacity-80" style={{ color: fg }}>
                  {sub}
                </p>
              ) : null}
            </div>
          </div>
        </header>
      );
    }
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
    if (bannerVisible) {
      return (
        <header className="flex w-full flex-col">
          {bannerBlock}
          <div className="relative z-10 -mt-14 flex flex-col items-center gap-2 px-5 pb-1 text-center sm:px-8">
            <Avatar handle={handle} url={page.avatarUrl} className="h-24 w-24 rounded-full ring-4 ring-white shadow-xl" iconClass="h-9 w-9" />
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
    if (bannerVisible) {
      return (
        <header className="flex w-full flex-col">
          {bannerBlock}
          <div className="relative z-10 flex w-full items-center gap-4 px-5 pb-2 text-left sm:px-8">
            <Avatar
              handle={handle}
              url={page.avatarUrl}
              className="-mt-14 h-24 w-20 shrink-0 rounded-[24px] ring-4 ring-white shadow-xl"
              iconClass="h-8 w-8"
            />
            <div className="min-w-0 pt-10">
              <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: fg }}>
                {handle}
              </h1>
              {sub ? (
                <p className="text-[14px] font-medium opacity-80" style={{ color: fg }}>
                  {sub}
                </p>
              ) : null}
            </div>
          </div>
        </header>
      );
    }
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
    if (bannerVisible) {
      return (
        <header className="flex w-full flex-col items-center text-center">
          {bannerBlock}
          <div className="relative z-10 -mt-14 flex flex-col items-center gap-3 px-5 pb-1 sm:px-8">
            <Avatar
              handle={handle}
              url={page.avatarUrl}
              className="h-24 w-28 rounded-[48%_52%_55%_45%/48%_45%_55%_52%] ring-4 ring-white shadow-xl"
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
          </div>
        </header>
      );
    }
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

  if (bannerVisible) {
    const avatarSize = variant === "hero" ? "h-28 w-28 rounded-[28px]" : "h-24 w-24 rounded-full";
    const titleSize = variant === "hero" ? "text-[26px]" : "text-[22px]";
    return (
      <header className="flex w-full flex-col items-center text-center">
        {bannerBlock}
        <div className="relative z-10 -mt-14 flex flex-col items-center gap-3 px-5 pb-1 sm:px-8">
          <Avatar handle={handle} url={page.avatarUrl} className={`${avatarSize} ring-4 ring-white shadow-xl`} iconClass="h-12 w-12" />
          <h1 className={`${titleSize} font-extrabold leading-tight tracking-tight`} style={{ color: fg }}>
            {handle}
          </h1>
          {sub ? (
            <p className="text-[15px] font-medium opacity-90" style={{ color: fg }}>
              {sub}
            </p>
          ) : null}
        </div>
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

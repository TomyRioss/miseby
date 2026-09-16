import Link from "next/link";
import type { MiseLinkTheme } from "@/lib/miselink/theme";

export function MiseLinkFooter({ theme }: { theme?: MiseLinkTheme }) {
  if (theme && !theme.footerVisible) return <div className="mt-auto pt-10" />;
  const fg = theme?.colors.text ?? "#262626";
  const custom = theme?.footerText?.trim();
  return (
    <footer className="mt-auto flex w-full flex-col items-center gap-4 pt-16">
      <Link
        href="/"
        className="rounded-full bg-white px-5 py-2.5 text-[15px] font-semibold text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-transform hover:scale-105 active:scale-95"
      >
        Crear mi Mise Link
      </Link>
      <p className="px-4 text-center text-[11px] leading-relaxed opacity-80" style={{ color: fg }}>
        {custom || "Hecho con MISE BY"}
      </p>
    </footer>
  );
}

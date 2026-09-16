"use client";

import Link from "next/link";
import { BookOpen, Building2, ChartNoAxesColumn, ChevronDown, CreditCard, LayoutDashboard, Link2, LogOut, Package, QrCode, Settings, Sparkles, Tags, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PLAN_LABELS } from "@/lib/mise-labels";

export function BusinessHeader({ markSuffix, planCode }: { markSuffix?: string; planCode?: string }) {
  const router = useRouter();
  const resolvedSuffix = markSuffix ?? (planCode ? PLAN_LABELS[planCode] : undefined);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("[logout]", e);
    }
    router.replace("/login");
  };

  return (
    <header className="rounded-b-2xl bg-[#0A2540] px-4 py-3 text-white sm:px-6">
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-1.5 font-display text-base font-bold tracking-tight text-white sm:text-lg"
        >
          MISE BY
          {resolvedSuffix ? (
            <>
              <span className="text-white/60" aria-hidden>
                x
              </span>
              <span className="text-white">{resolvedSuffix}</span>
            </>
          ) : null}
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Salir"
          className="absolute right-0 rounded-full p-2 transition-colors hover:bg-white/10 md:hidden"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export function BusinessSidebar({ userLabel, hasMiseLink = false, planCode }: { userLabel: string; hasMiseLink?: boolean; planCode?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isRestaurant = planCode === "mise_restaurant";
  const isMiseLinkSection = pathname?.startsWith("/dashboard/miselink") ?? false;
  const [open, setOpen] = usePersistentOpen("miseby.nav.miselink", isMiseLinkSection);
  useEffect(() => {
    if (isMiseLinkSection) setOpen(true);
  }, [isMiseLinkSection, setOpen]);
  const isLinksActive = pathname === "/dashboard/miselink";
  const isDesignActive = pathname === "/dashboard/miselink/design";

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("[logout]", e);
    }
    router.replace("/login");
  };

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
      <DropdownMenu>
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                aria-haspopup="menu"
                aria-label={`Cuenta: ${userLabel}`}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  <User className="h-5 w-5 shrink-0 text-muted-foreground" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {userLabel}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={8}
            className="max-w-[min(20rem,calc(100vw-2rem))] break-words"
          >
            <span className="block select-all text-xs font-medium">{userLabel}</span>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="w-[min(20rem,calc(100vw-2rem))] p-1.5"
        >
          <DropdownMenuLabel className="px-3 py-3">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Cuenta
            </span>
            <span
              aria-label={userLabel}
              className="block max-w-full select-all whitespace-normal break-words text-xs font-medium normal-case leading-relaxed tracking-normal text-foreground"
            >
              {userLabel}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1.5" />
          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide focus:bg-accent focus:text-accent-foreground">
            <Link href="/dashboard/cuenta">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              CUENTA
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide focus:bg-accent focus:text-accent-foreground">
            <Link href="/dashboard/billing">
              <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
              BILLING &amp; PLANS
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide focus:bg-accent focus:text-accent-foreground">
            <Link href="/dashboard/ajustes">
              <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
              AJUSTES
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1.5" />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide text-destructive focus:bg-destructive/10 focus:text-destructive">
            <LogOut className="h-4 w-4 shrink-0 text-destructive/70" />
            Salir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="mt-2 space-y-1">
        {isRestaurant ? (
          <RestaurantNav pathname={pathname} />
        ) : (
          <>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Building2 className="h-4 w-4" />
          Inicio
        </Link>
        <div>
          {hasMiseLink ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            <Link2 className="h-4 w-4" />
            <span className="flex-1 text-left">My MiseLink</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          ) : null}
          {open && hasMiseLink && (
            <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">
              <Link
                href="/dashboard/miselink"
                className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  isLinksActive
                    ? "bg-muted font-semibold text-[#6D28D9]"
                    : "font-medium text-muted-foreground"
                }`}
              >
                Links
              </Link>
              <Link
                href="/dashboard/miselink/design"
                className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  isDesignActive
                    ? "bg-muted font-semibold text-[#6D28D9]"
                    : "font-medium text-muted-foreground"
                }`}
              >
                Diseño
              </Link>
            </div>
          )}
        </div>
          </>
        )}
      </nav>
    </aside>
  );
}

function usePersistentOpen(key: string, defaultOpen: boolean) {
  const [open, setOpen] = useState(defaultOpen);
  // Sync from localStorage on mount (SSR-safe: server and client render the same initial DOM)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setOpen(stored === "1");
    } catch (e) {
      console.error("[sidebar persist]", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Persist to localStorage on change
  useEffect(() => {
    try {
      window.localStorage.setItem(key, open ? "1" : "0");
    } catch (e) {
      console.error("[sidebar persist]", e);
    }
  }, [key, open]);
  return [open, setOpen] as const;
}

const RESTAURANT_ITEMS_TOP = [
  { href: "/dashboard", label: "Vista general", icon: LayoutDashboard },
  { href: "/dashboard/negocio", label: "Mi negocio", icon: Building2 },
];

const RESTAURANT_ITEMS_BOTTOM = [
  { href: "/dashboard/mise-ia", label: "Mise IA", icon: Sparkles },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartNoAxesColumn },
];

function RestaurantNav({ pathname }: { pathname: string | null }) {
  const isMiseLinkSection = pathname?.startsWith("/dashboard/miselink") ?? false;
  const [linkOpen, setLinkOpen] = usePersistentOpen("miseby.nav.miselink", isMiseLinkSection);
  const isLinksActive = pathname === "/dashboard/miselink";
  const isDesignActive = pathname === "/dashboard/miselink/design";
  const isMenuActive = (href: string) =>
    href === "/dashboard/menu"
      ? pathname === href ||
        pathname?.startsWith("/dashboard/catalogo") ||
        pathname?.startsWith("/dashboard/categorias") ||
        pathname?.startsWith("/dashboard/productos") ||
        false
      : (pathname?.startsWith(href) ?? false);
  const isMenuContentActive = isMenuActive("/dashboard/menu");
  const isAppearanceActive = pathname?.startsWith("/dashboard/apariencia") ?? false;
  const isMenuSection = isMenuContentActive || isAppearanceActive;
  const [menuOpen, setMenuOpen] = usePersistentOpen("miseby.nav.menu", !!isMenuSection);
  // La sección con la ruta activa siempre abre; la otra conserva su estado manual.
  useEffect(() => {
    if (isMiseLinkSection) setLinkOpen(true);
  }, [isMiseLinkSection, setLinkOpen]);
  useEffect(() => {
    if (isMenuSection) setMenuOpen(true);
  }, [isMenuSection, setMenuOpen]);
  const renderItem = (item: { href: string; label: string; icon: typeof LayoutDashboard }) => {
    const Icon = item.icon;
    const active =
      item.href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.href) ?? false;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
          active ? "bg-muted font-semibold text-foreground" : "font-medium text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };
  return (
    <div className="space-y-1">
      {RESTAURANT_ITEMS_TOP.map(renderItem)}
      <button
        type="button"
        onClick={() => setLinkOpen((v) => !v)}
        aria-expanded={linkOpen}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
      >
        <QrCode className="h-4 w-4" />
        <span className="flex-1 text-left">Mise Link & QR</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${linkOpen ? "rotate-180" : ""}`}
        />
      </button>
      {linkOpen && (
        <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">
          <Link
            href="/dashboard/miselink"
            className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
              isLinksActive
                ? "bg-muted font-semibold text-[#6D28D9]"
                : "font-medium text-muted-foreground"
            }`}
          >
            Links
          </Link>
          <Link
            href="/dashboard/miselink/design"
            className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
              isDesignActive
                ? "bg-muted font-semibold text-[#6D28D9]"
                : "font-medium text-muted-foreground"
            }`}
          >
            Diseño
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
          isMenuSection ? "bg-muted font-semibold text-foreground" : "font-medium text-muted-foreground"
        }`}
      >
        <BookOpen className="h-4 w-4" />
        <span className="flex-1 text-left">Menú</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${menuOpen ? "rotate-180" : ""}`}
        />
      </button>
      {menuOpen && (
        <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">
          <Link
            href="/dashboard/menu"
            className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
              isMenuContentActive
                ? "bg-muted font-semibold text-[#6D28D9]"
                : "font-medium text-muted-foreground"
            }`}
          >
            Contenido
          </Link>
          <Link
            href="/dashboard/apariencia"
            className={`block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
              isAppearanceActive
                ? "bg-muted font-semibold text-[#6D28D9]"
                : "font-medium text-muted-foreground"
            }`}
          >
            Apariencia
          </Link>
        </div>
      )}
      {RESTAURANT_ITEMS_BOTTOM.map(renderItem)}
    </div>
  );
}

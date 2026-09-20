"use client";

import Link from "next/link";
import { BookOpen, Building2, ChartNoAxesColumn, ChevronDown, LayoutDashboard, Link2, LogOut, Package, QrCode, Sparkles, Tags, Users } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
          className="cursor-pointer inline-flex items-center justify-center gap-1.5 font-display text-base font-bold tracking-tight text-white sm:text-lg"
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
          className="cursor-pointer absolute right-0 rounded-full p-2 transition-colors hover:bg-white/10 md:hidden"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

export function BusinessSidebar({ account, hasMiseLink = false, planCode }: { account?: React.ReactNode; hasMiseLink?: boolean; planCode?: string }) {
  // hasMiseLink se ignora a propósito: el toggle siempre visible (consistente en todas las páginas).
  void hasMiseLink;
  const pathname = usePathname();
  const isRestaurant = planCode === "mise_restaurant";
  const isMiseLinkSection = pathname?.startsWith("/dashboard/miselink") ?? false;
  // open = manual(persistido) || sección activa. Nunca fuerza cierre.
  const [open, setOpen] = usePersistentOpen("miseby.nav.miselink", isMiseLinkSection);
  const isLinksActive = pathname === "/dashboard/miselink";
  const isDesignActive = pathname === "/dashboard/miselink/design";

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
      {account}
      <nav className="mt-2 space-y-1">
        {isRestaurant ? (
          <RestaurantNav pathname={pathname} />
        ) : planCode === "mise" ? (
          <MiseNav pathname={pathname} />
        ) : (
          <MiseFallbackNav
            pathname={pathname}
            planCode={planCode}
            open={open}
            setOpen={setOpen}
            isLinksActive={isLinksActive}
            isDesignActive={isDesignActive}
          />
        )}
      </nav>
    </aside>
  );
}

function MiseFallbackNav({
  pathname,
  planCode,
  open,
  setOpen,
  isLinksActive,
  isDesignActive,
}: {
  pathname: string | null;
  planCode?: string;
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  isLinksActive: boolean;
  isDesignActive: boolean;
}) {
  return (
    <>
      <Link
        href="/dashboard"
        className="cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
      >
        <Building2 className="h-4 w-4" />
        Inicio
      </Link>
      {planCode === "mise" && (
        <Link
          href="/dashboard/catalogo"
          className={`cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
            pathname?.startsWith("/dashboard/catalogo")
              ? "bg-muted font-semibold text-foreground"
              : "font-medium text-muted-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Catálogo
        </Link>
      )}
      <div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Link2 className="h-4 w-4" />
          <span className="flex-1 text-left">My MiseLink</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">
            <Link
              href="/dashboard/miselink"
              className={`cursor-pointer block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
                isLinksActive
                  ? "bg-muted font-semibold text-[#6D28D9]"
                  : "font-medium text-muted-foreground"
              }`}
            >
              Links
            </Link>
            <Link
              href="/dashboard/miselink/design"
              className={`cursor-pointer block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
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
  );
}

// Flag a nivel de módulo: distingue primera hidratación (SSR-safe) de remounts
// posteriores por navegación cliente (lectura síncrona sin flash).
let navHydrated = false;

function readStoredOpen(key: string): boolean | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(key);
    if (stored === null) return null;
    return stored === "1";
  } catch (e) {
    console.error("[sidebar persist]", e);
    return null;
  }
}

function usePersistentOpen(key: string, sectionActive: boolean) {
  // Init lazy: mismo valor en server y primer render cliente (false) → sin mismatch.
  // En remounts post-hidratación lee localStorage síncrono → sin flash al navegar.
  const [manual, setManual] = useState<boolean>(() => {
    try {
      if (typeof window === "undefined") return false;
      if (!navHydrated) return false;
      return readStoredOpen(key) ?? false;
    } catch (e) {
      console.error("[sidebar persist]", e);
      return false;
    }
  });
  const [hydrated, setHydrated] = useState(false);
  // Hidratación: aplica valor persistido una sola vez por montaje.
  useEffect(() => {
    const stored = readStoredOpen(key);
    if (stored !== null) setManual(stored);
    setHydrated(true);
    navHydrated = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // Persistencia: nunca escribe el valor inicial stale (guard hydrated).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, manual ? "1" : "0");
    } catch (e) {
      console.error("[sidebar persist]", e);
    }
  }, [key, manual, hydrated]);
  // La sección con ruta activa siempre auto-abre; jamás fuerza cierre de la otra.
  const open = manual || sectionActive;
  // Setter sobre estado manual. Los toggles llaman `setX(!x)` con el `open`
  // derivado: cerrar la sección activa la mantiene abierta (spec) sin
  // contaminar persistencia; al salir vuelve a su estado manual previo.
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setManual((prevManual) =>
        typeof value === "function"
          ? (value as (p: boolean) => boolean)(prevManual)
          : value
      );
    },
    []
  );
  return [open, setOpen] as const;
}

const RESTAURANT_ITEMS_TOP = [
  { href: "/dashboard", label: "Vista general", icon: LayoutDashboard },
  { href: "/dashboard/negocio", label: "Mi negocio", icon: Building2 },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
];

const RESTAURANT_ITEMS_BOTTOM = [
  { href: "/dashboard/mise-ia", label: "Mise IA", icon: Sparkles },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartNoAxesColumn },
];

function RestaurantNav({ pathname }: { pathname: string | null }) {
  return (
    <GenericBusinessNav
      pathname={pathname}
      catalogLabel="Menú"
      catalogContentHref="/dashboard/menu"
      isCatalogContentActive={(p) =>
        p === "/dashboard/menu" ||
        p?.startsWith("/dashboard/catalogo") ||
        p?.startsWith("/dashboard/categorias") ||
        p?.startsWith("/dashboard/productos") ||
        false
      }
    />
  );
}

function MiseNav({ pathname }: { pathname: string | null }) {
  return (
    <GenericBusinessNav
      pathname={pathname}
      catalogLabel="Catálogo"
      catalogContentHref="/dashboard/catalogo"
      isCatalogContentActive={(p) => p?.startsWith("/dashboard/catalogo") ?? false}
    />
  );
}

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

function NavTopLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const Icon = item.icon;
  const active =
    item.href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.href) ?? false;
  return (
    <Link
      key={item.href}
      href={item.href}
      className={`cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
        active ? "bg-muted font-semibold text-foreground" : "font-medium text-muted-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

function NavDropdown({
  icon: Icon,
  label,
  open,
  onToggle,
  active,
  children,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  open: boolean;
  onToggle: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-muted ${
          active ? "bg-muted font-semibold text-foreground" : "font-medium text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">{children}</div>
      )}
    </>
  );
}

function NavSubLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`cursor-pointer block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted ${
        active ? "bg-muted font-semibold text-[#6D28D9]" : "font-medium text-muted-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function GenericBusinessNav({
  pathname,
  catalogLabel,
  catalogContentHref,
  isCatalogContentActive,
}: {
  pathname: string | null;
  catalogLabel: string;
  catalogContentHref: string;
  isCatalogContentActive: (pathname: string | null) => boolean;
}) {
  const isMiseLinkSection = pathname?.startsWith("/dashboard/miselink") ?? false;
  const [linkOpen, setLinkOpen] = usePersistentOpen("miseby.nav.miselink", isMiseLinkSection);
  const isLinksActive = pathname === "/dashboard/miselink";
  const isDesignActive = pathname === "/dashboard/miselink/design";
  const isCatalogContent = isCatalogContentActive(pathname);
  const isAppearanceActive = pathname?.startsWith("/dashboard/apariencia") ?? false;
  const isCatalogSection = isCatalogContent || isAppearanceActive;
  const [catalogOpen, setCatalogOpen] = usePersistentOpen("miseby.nav.menu", !!isCatalogSection);
  // `open = manual || sectionActive` dentro del hook: la sección activa
  // siempre auto-abre; la otra conserva su estado manual (jamás cierre forzado).
  return (
    <div className="space-y-1">
      {RESTAURANT_ITEMS_TOP.map((item) => (
        <NavTopLink key={item.href} item={item} pathname={pathname} />
      ))}
      <NavDropdown
        icon={QrCode}
        label="Mise Link & QR"
        open={linkOpen}
        onToggle={() => setLinkOpen((prev) => !prev)}
      >
        <NavSubLink href="/dashboard/miselink" active={isLinksActive}>
          Links
        </NavSubLink>
        <NavSubLink href="/dashboard/miselink/design" active={isDesignActive}>
          Diseño
        </NavSubLink>
      </NavDropdown>
      <NavDropdown
        icon={BookOpen}
        label={catalogLabel}
        open={catalogOpen}
        onToggle={() => setCatalogOpen((prev) => !prev)}
        active={isCatalogSection}
      >
        <NavSubLink href={catalogContentHref} active={isCatalogContent}>
          Contenido
        </NavSubLink>
        <NavSubLink href="/dashboard/apariencia" active={isAppearanceActive}>
          Apariencia
        </NavSubLink>
      </NavDropdown>
      {RESTAURANT_ITEMS_BOTTOM.map((item) => (
        <NavTopLink key={item.href} item={item} pathname={pathname} />
      ))}
    </div>
  );
}

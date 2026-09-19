"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  Mail,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  User,
  ChevronDown,
} from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";

const ACCOUNT_MENU = [
  { href: "/control/cuenta", label: "CUENTA", icon: User },
  { href: "/control/membresias", label: "BILLING & PLANS", icon: CreditCard },
  { href: "/control/configuracion", label: "AJUSTES", icon: Settings },
];

const NAV = [
  { href: "/control", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/control/negocios", label: "Negocios", icon: Building2 },
  { href: "/control/membresias", label: "Membresías", icon: CreditCard },
  { href: "/control/usuarios", label: "Usuarios", icon: Users },
  { href: "/control/invitaciones", label: "Invitaciones", icon: Mail },
  { href: "/control/auditoria", label: "Auditoría", icon: ClipboardList },
  { href: "/control/configuracion", label: "Configuración", icon: Settings },
];

function NavItem({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function PlatformShell({
  children,
  userLabel,
}: {
  children: React.ReactNode;
  userLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace("/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col p-4">
      <div className="mb-8 px-2 pt-2">
        <MiseMark tone="white" />
        <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-white/50">
          Control Center
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item)} onClick={() => setOpen(false)} />
        ))}
      </nav>

      <div className="mt-4 border-t border-white/20 pt-4">
        <button
          onClick={() => setUserMenuOpen((p) => !p)}
          aria-expanded={userMenuOpen}
          title={userLabel}
          className="cursor-pointer flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="flex-1 truncate text-left">{userLabel}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {userMenuOpen && (
          <div className="mt-2 overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/10">
            <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Cuenta
            </p>
            <p
              title={userLabel}
              className="max-h-16 overflow-y-auto break-all px-2.5 pb-2 text-xs font-medium leading-relaxed text-foreground"
            >
              {userLabel}
            </p>
            <div className="my-1 h-px bg-border" />
            <div className="space-y-0.5">
              {ACCOUNT_MENU.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setUserMenuOpen(false);
                      setOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`cursor-pointer flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold tracking-wide transition-colors ${
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="my-1 h-px bg-border" />
            <button
              onClick={handleLogout}
              className="cursor-pointer flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Salir
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="mise-gradient hidden w-60 shrink-0 lg:flex lg:flex-col">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="mise-gradient relative z-50 w-60 shrink-0 overflow-y-auto">{sidebar}</aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-border px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="cursor-pointer rounded-lg p-2 text-foreground hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
          <MiseMark />
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

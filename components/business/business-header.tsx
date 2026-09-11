"use client";

import Link from "next/link";
import { Building2, ChevronDown, Link2, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BusinessHeader({ markSuffix }: { markSuffix?: string }) {
  const router = useRouter();

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
          {markSuffix ? (
            <>
              <span className="text-white/60" aria-hidden>
                &bull;
              </span>
              <span className="text-white">{markSuffix}</span>
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

export function BusinessSidebar({ userLabel }: { userLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMiseLinkSection = pathname?.startsWith("/dashboard/miselink") ?? false;
  const [open, setOpen] = useState(isMiseLinkSection);
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
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              <User className="h-5 w-5 shrink-0 text-muted-foreground" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {userLabel}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="h-4 w-4" />
            Salir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="mt-2 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Building2 className="h-4 w-4" />
          Inicio
        </Link>
        <div>
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
          {open && (
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
      </nav>
    </aside>
  );
}

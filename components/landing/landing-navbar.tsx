"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { PLANS } from "@/lib/landing/plans";
import { Button } from "@/components/ui/button";

export function LandingNavbar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="cursor-pointer" aria-label="MISE BY inicio">
          <MiseMark />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {PLANS.map((plan) => (
            <Link
              key={plan.slug}
              href={plan.href}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {plan.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <Button asChild>
              <Link href="/dashboard" className="cursor-pointer">
                Ir al panel
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login" className="cursor-pointer">
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register" className="cursor-pointer">
                  Registrar negocio
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer rounded-lg p-2 text-foreground hover:bg-secondary md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border/60 bg-background px-4 pb-5 pt-2 md:hidden">
          {PLANS.map((plan) => (
            <Link
              key={plan.slug}
              href={plan.href}
              onClick={() => setOpen(false)}
              className="cursor-pointer block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              {plan.name}
              <span className="block text-xs font-normal text-muted-foreground">{plan.tagline}</span>
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
            {isLoggedIn ? (
              <Button asChild className="flex-1">
                <Link href="/dashboard" className="cursor-pointer" onClick={() => setOpen(false)}>
                  Ir al panel
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/login" className="cursor-pointer" onClick={() => setOpen(false)}>
                    Iniciar sesión
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/register" className="cursor-pointer" onClick={() => setOpen(false)}>
                    Registrar negocio
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

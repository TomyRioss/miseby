"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { PLANS } from "@/lib/landing/plans";
import { Button } from "@/components/ui/button";

export function LandingNavbar({ heroOverlay = false }: { heroOverlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scrollContainer = headerRef.current?.parentElement;
    if (!scrollContainer) return;

    const updateScrolled = () => setScrolled(scrollContainer.scrollTop > 8);
    updateScrolled();
    scrollContainer.addEventListener("scroll", updateScrolled, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", updateScrolled);
  }, []);

  const lightHeader = !heroOverlay || scrolled || open;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 ${heroOverlay ? "-mb-16" : ""} border-b transition-colors duration-200 ${
        lightHeader
          ? "border-border/60 bg-background/95 text-foreground shadow-sm backdrop-blur"
          : "border-transparent bg-transparent text-white"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="cursor-pointer" aria-label="MISE BY inicio">
          <MiseMark tone={lightHeader ? "brand" : "white"} />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {PLANS.map((plan) => (
            <Link
              key={plan.slug}
              href={plan.href}
              className={`group cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                lightHeader
                  ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="relative inline-block after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-blue-500 after:transition-transform after:duration-300 after:ease-out after:content-[''] group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100 motion-reduce:after:transition-none">
                {plan.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            className={lightHeader ? "" : "text-white hover:bg-white/10 hover:text-white"}
            asChild
          >
            <Link href="/login" className="cursor-pointer">
              Iniciar sesión
            </Link>
          </Button>
          <Button asChild>
            <Link href="/register" className="cursor-pointer">
              Registrar negocio
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`cursor-pointer rounded-lg p-2 transition-colors md:hidden ${
            lightHeader ? "text-foreground hover:bg-secondary" : "text-white hover:bg-white/10"
          }`}
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
              className="group block cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <span className="relative inline-block after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-blue-500 after:transition-transform after:duration-300 after:ease-out after:content-[''] group-hover:after:scale-x-100 group-focus-visible:after:scale-x-100 motion-reduce:after:transition-none">
                {plan.name}
              </span>
              <span className="block text-xs font-normal text-muted-foreground">{plan.tagline}</span>
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
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
          </div>
        </div>
      )}
    </header>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { auth } from "@/auth";
import { PLANS, getPlan } from "@/lib/landing/plans";

interface PlanPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PLANS.map((plan) => ({ slug: plan.slug }));
}

export async function generateMetadata({ params }: PlanPageProps): Promise<Metadata> {
  const { slug } = await params;
  const plan = getPlan(slug);
  if (!plan) return { title: "Plan no encontrado | MISE BY" };
  return {
    title: `${plan.name} | MISE BY`,
    description: `${plan.tagline}. ${plan.description} Precio: ${plan.priceLabel}.`,
  };
}

export default async function PlanDetailPage({ params }: PlanPageProps) {
  const { slug } = await params;
  const plan = getPlan(slug);
  if (!plan) notFound();

  const others = PLANS.filter((p) => p.slug !== plan.slug);
  const session = await auth();

  return (
    <div className="h-full overflow-y-auto bg-background">
      <LandingNavbar isLoggedIn={Boolean(session?.user)} />

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Link
          href="/#planes"
          className="cursor-pointer mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Ver todos los planes
        </Link>

        {/* Hero del plan */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <div className="px-6 py-10 sm:px-10 sm:py-14" style={{ backgroundColor: `${plan.accent}14` }}>
            <p className="text-sm font-semibold" style={{ color: plan.accent }}>
              Plan {plan.name}
            </p>
            <h1 className="font-display mt-2 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {plan.tagline}
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">{plan.description}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          {/* Features */}
          <section aria-label={`Qué incluye ${plan.name}`}>
            <h2 className="font-display text-xl font-bold text-foreground">
              Qué incluye {plan.name}
            </h2>
            <ul className="mt-6 space-y-5">
              {plan.features.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: plan.accent }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{f.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Precio */}
          <aside aria-label="Precio y contratación">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
              <p className="text-sm font-medium text-muted-foreground">Plan {plan.name}</p>
              <p className="font-display mt-2 text-4xl font-bold text-foreground">{plan.priceLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{plan.priceNote}</p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href="/register" className="cursor-pointer">
                  Registrar mi negocio
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/login" className="cursor-pointer">
                  Ya tengo cuenta
                </Link>
              </Button>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Al registrarte podrás elegir este plan para tu negocio y empezar a configurarlo de
                inmediato.
              </p>
            </div>
          </aside>
        </div>

        {/* Otros planes */}
        <section className="mt-16" aria-label="Otros planes">
          <h2 className="font-display text-xl font-bold text-foreground">También te puede interesar</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {others.map((other) => (
              <Link
                key={other.slug}
                href={other.href}
                className="cursor-pointer group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <p className="font-display font-bold text-foreground">{other.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{other.tagline}</p>
                <p className="mt-3 text-sm font-semibold text-foreground">{other.priceLabel}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#0E88E2]">
                  Ver detalles
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

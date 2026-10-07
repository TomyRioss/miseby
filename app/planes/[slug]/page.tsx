import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
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

  return (
    <div className="h-full overflow-y-auto bg-background">
      <LandingNavbar />

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Link
          href="/#planes"
          className="cursor-pointer mt-8 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" /> Ver todos los planes
        </Link>

        {/* Hero del plan */}
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1fr_0.7fr] lg:items-end" style={{ backgroundColor: `${plan.accent}0b` }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: plan.slug === "mise-restaurant" ? "#007A93" : "#075296" }}>Plan {plan.name}</p>
              <h1 className="font-display mt-3 max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              {plan.tagline}
              </h1>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground lg:justify-self-end">{plan.description}</p>
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_0.8fr] lg:gap-16">
          {/* Features */}
          <section aria-label={`Qué incluye ${plan.name}`}>
            <h2 className="font-display max-w-lg text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Qué incluye {plan.name}
            </h2>
            <ul className="mt-7 divide-y divide-border border-y border-border">
              {plan.features.map((f) => (
                <li key={f.title} className="grid gap-1 py-5 sm:grid-cols-[0.85fr_1fr] sm:gap-8">
                  <p className="font-display text-base font-semibold text-foreground">{f.title}</p>
                  <div className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0" style={{ color: plan.accent }} />
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Precio */}
          <aside aria-label="Precio y contratación">
            <div className="rounded-2xl bg-[#0A2540] p-6 text-white sm:p-7 lg:sticky lg:top-24">
              <p className="text-sm font-medium text-white/70">Plan {plan.name}</p>
              <p className="font-display mt-3 text-4xl font-bold tracking-tight text-white">{plan.priceLabel}</p>
              <p className="mt-1 text-xs text-white/65">{plan.priceNote}</p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href="/register" className="cursor-pointer">
                  Registrar mi negocio
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/login" className="cursor-pointer">
                  Ya tengo cuenta
                </Link>
              </Button>
              <p className="mt-4 text-xs leading-relaxed text-white/70">
                Al registrarte podrás elegir este plan para tu negocio y empezar a configurarlo de inmediato.
              </p>
            </div>
          </aside>
        </div>

        {/* Otros planes */}
        <section className="mt-16" aria-label="Otros planes">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">También te puede interesar</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {others.map((other) => (
              <Link
                key={other.slug}
                href={other.href}
                className="cursor-pointer group rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

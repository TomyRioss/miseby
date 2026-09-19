import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Link2, Store, UtensilsCrossed } from "lucide-react";
import { auth } from "@/auth";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PLANS, type PlanSlug } from "@/lib/landing/plans";

export const metadata: Metadata = {
  title: "MISE BY | Presencia digital para negocios",
  description:
    "MISE BY es una plataforma SaaS de presencia digital para negocios: Mise Link, Mise y Mise Restaurant. Powered by Mar Digital Business.",
};

const PLAN_ICONS: Record<PlanSlug, typeof Link2> = {
  "mise-link": Link2,
  mise: Store,
  "mise-restaurant": UtensilsCrossed,
};

const STEPS = [
  {
    title: "Registra tu negocio",
    detail: "Crea tu cuenta en minutos, sin tarjeta ni instalaciones.",
  },
  {
    title: "Elige tu plan",
    detail: "Mise Link, Mise o Mise Restaurant según lo que vendas.",
  },
  {
    title: "Publica y comparte",
    detail: "Activa tu página o menú y compártelo con un link o QR.",
  },
];

const FAQS = [
  {
    q: "¿Puedo cambiar de plan después?",
    a: "Sí. Puedes empezar con un plan y cambiar a otro cuando tu negocio lo necesite, sin perder tu información.",
  },
  {
    q: "¿El precio es definitivo?",
    a: "No. Los valores publicados son precios de lanzamiento y pueden ajustarse. Te avisaremos antes de cualquier cambio.",
  },
  {
    q: "¿Necesito conocimientos técnicos?",
    a: "No. Todo se configura desde un panel visual: subes tu información, personalizas la apariencia y publicas.",
  },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "platform_owner" ? "/control" : "/dashboard");
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <LandingNavbar />

      {/* Hero */}
      <section className="mise-gradient relative overflow-hidden text-white">
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <Reveal className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Presencia digital para negocios
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
              Un link para compartir, una página para vender o un menú digital para tu restaurante.
              Elige el plan que mejor se adapte a tu negocio.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="#planes" className="cursor-pointer">
                  Ver planes <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/register" className="cursor-pointer">
                  Registrar mi negocio
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Tres planes, un mismo objetivo
          </h2>
          <p className="mt-3 text-muted-foreground">
            Que tus clientes te encuentren, te conozcan y te compren. Compara y elige.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = PLAN_ICONS[plan.slug];
            return (
              <article
                key={plan.slug}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: plan.accent }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display mt-5 text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm font-medium" style={{ color: plan.accent }}>
                  {plan.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.slice(0, 3).map((f) => (
                    <li key={f.title} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: plan.accent }} />
                      {f.title}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-border pt-5">
                  <p className="font-display text-2xl font-bold text-foreground">{plan.priceLabel}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{plan.priceNote}</p>
                  <Button asChild className="mt-4 w-full">
                    <Link href={plan.href} className="cursor-pointer">
                      Ver detalles <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Pasos */}
      <section className="border-y border-border bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Empieza en tres pasos
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="font-display text-sm font-bold text-[#0E88E2]">
                  Paso {i + 1}
                </span>
                <p className="font-display mt-2 font-semibold text-foreground">{step.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Preguntas frecuentes
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {FAQS.map((faq) => (
            <div key={faq.q}>
              <p className="font-semibold text-foreground">{faq.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-[#0A2540] p-8 text-center text-white sm:p-12">
          <h3 className="font-display text-2xl font-bold">¿Listo para digitalizar tu negocio?</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
            Regístrate gratis y elige entre Mise Link, Mise y Mise Restaurant.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-6">
            <Link href="/register" className="cursor-pointer">
              Registrar mi negocio <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, PartyPopper, Rocket } from "lucide-react";

type Step = { done: boolean; label: string; detail: string; href: string };

export function AnalyticsNextStep({ steps }: { steps: Step[] }) {
  const next = steps.find((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section aria-labelledby="an-next" className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A2540] text-white">
          {next ? <Rocket className="h-4 w-4" /> : <PartyPopper className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <h2 id="an-next" className="text-base font-semibold tracking-tight">
            Siguiente paso
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {next ? `${doneCount} de ${steps.length} · te falta poco` : "Carta lista para vender"}
          </p>
        </div>
      </div>
      {next ? (
        <>
          <p className="mb-4 mt-3 text-sm leading-relaxed text-muted-foreground">
            Te falta <strong className="text-foreground">{next.label}</strong> {next.detail}
          </p>
          <ol className="mb-5 space-y-1.5">
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2 text-[13px]">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                    step.done ? "bg-emerald-600 text-white" : next.label === step.label ? "bg-[#0A2540] text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={step.done ? "text-muted-foreground line-through" : "font-medium"}>{step.label}</span>
              </li>
            ))}
          </ol>
          <Link
            href={next.href}
            className="cursor-pointer mt-auto inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0A2540]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2"
          >
            Completarlo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      ) : (
        <>
          <p className="mb-4 mt-3 text-sm leading-relaxed text-muted-foreground">
            Carta completa y publicada. El siguiente nivel es medir visitas por día y plato más visto, con historial real
            en base de datos.
          </p>
          <Link
            href="/dashboard/miselink"
            className="cursor-pointer mt-auto inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0A2540]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2"
          >
            Compartir mi carta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      )}
    </section>
  );
}

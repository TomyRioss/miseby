import Link from "next/link";
import { ArrowRight, Check, Circle, ListChecks } from "lucide-react";

export type ChecklistItem = {
  done: boolean;
  label: string;
  detail: string;
  href: string;
};

export function AnalyticsChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;

  return (
    <section aria-labelledby="an-check" className="min-w-0 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D28D9]/10">
          <ListChecks className="h-4 w-4 text-[#6D28D9]" />
        </span>
        <div className="min-w-0">
          <h2 id="an-check" className="text-base font-semibold tracking-tight">
            Checklist de tu carta
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {done} de {items.length} completados
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            {item.done ? (
              <div className="flex items-start gap-2.5 rounded-lg px-2 py-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-label="Completado">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ) : (
              <Link
                href={item.href}
                className="cursor-pointer group flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
              >
                <Circle className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Pendiente" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium group-hover:underline group-hover:underline-offset-2">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

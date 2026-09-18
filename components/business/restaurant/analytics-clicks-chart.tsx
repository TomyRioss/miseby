"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Link2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ClickDatum = { title: string; clicks: number };

function EmptyClicks({ hasLinks }: { hasLinks: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {hasLinks ? <BarChart3 className="h-5 w-5 text-muted-foreground" /> : <Link2 className="h-5 w-5 text-muted-foreground" />}
      </span>
      <p className="text-sm font-medium">{hasLinks ? "Todavía sin clicks" : "Todavía no tenés enlaces con visitas"}</p>
      <p className="max-w-xs text-[13px] text-muted-foreground">
        {hasLinks
          ? "Compartí tu link en Instagram, WhatsApp o en la puerta del local y volvé para ver qué enlace rinde más."
          : "Creá tu primer enlace en MiseLink y compartilo: acá vas a ver cuál recibe más clicks."}
      </p>
      <Link
        href="/dashboard/miselink"
        className="cursor-pointer mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0A2540]/90"
      >
        {hasLinks ? "Ver mis enlaces" : "Crear mi primer enlace"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function AnalyticsClicksChart({ data }: { data: ClickDatum[] }) {
  const total = data.reduce((acc, d) => acc + d.clicks, 0);
  const hasClicks = total > 0;

  return (
    <section aria-labelledby="an-clicks" className="min-w-0 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="an-clicks" className="text-base font-semibold tracking-tight">
            Clicks por enlace
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {hasClicks ? `${total} clicks en total · cuál rinde más` : "Descubrí qué enlace te trae más clientes"}
          </p>
        </div>
        {hasClicks && (
          <Link href="/dashboard/miselink" className="cursor-pointer inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground">
            Gestionar enlaces
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="mt-4">
        {!hasClicks ? (
          <EmptyClicks hasLinks={data.length > 0} />
        ) : (
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={110}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
                  className="fill-foreground"
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  formatter={(value) => [`${value} clicks`, "Clicks"]}
                />
                <Bar dataKey="clicks" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#6D28D9" : "#6D28D9"} opacity={i === 0 ? 1 : Math.max(0.45, 1 - i * 0.12)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

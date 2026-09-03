import type { Metadata } from "next";
import { Globe, Building2, Tag } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";

export const metadata: Metadata = { title: "Configuración — MISE BY Control Center" };

const PLANS = [
  { code: "mise_link", name: "MISE LINK", desc: "Presencia digital básica con perfil y links." },
  { code: "mise", name: "MISE", desc: "Perfil digital completo con catálogo." },
  { code: "mise_restaurant", name: "MISE RESTAURANT", desc: "Solución completa para restaurantes." },
];

export default function ConfigPage() {
  return (
    <div className="max-w-2xl p-6 lg:p-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Configuración</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">Información general de la plataforma.</p>

      <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#075296]/10 p-3">
            <Tag className="h-5 w-5 text-[#075296]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Plataforma</p>
            <MiseMark className="mt-1" />
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#075296]/10 p-3">
            <Globe className="h-5 w-5 text-[#075296]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Dominio</p>
            <a
              href="https://miseby.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-sm font-medium text-[#0E88E2] hover:underline"
            >
              https://miseby.com
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#075296]/10 p-3">
            <Building2 className="h-5 w-5 text-[#075296]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Desarrollado por</p>
            <a
              href="https://mardigital.com.co/business"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-sm font-medium text-[#0E88E2] hover:underline"
            >
              Mar Digital Business
            </a>
          </div>
        </div>

        <hr className="border-border" />

        <div>
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Planes disponibles</p>
          <div className="space-y-2">
            {PLANS.map((plan) => (
              <div key={plan.code} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <span className="text-sm font-semibold text-[#075296]">{plan.name}</span>
                <span className="text-sm text-muted-foreground">{plan.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Estado general</p>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Operacional
          </span>
        </div>
      </div>
    </div>
  );
}

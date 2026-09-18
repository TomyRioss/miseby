import { Clock, Mail } from "lucide-react";

export function NoMembershipBanner({ orgStatus }: { orgStatus: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-amber-100 p-4">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
      </div>
      <h2 className="font-display mb-2 text-xl font-semibold text-amber-900">
        Tu plan está siendo configurado
      </h2>
      <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-amber-800">
        {orgStatus === "pending"
          ? "Tu negocio está en revisión. El administrador de MISE BY activará tu cuenta y asignará tu plan pronto."
          : "Un administrador de MISE BY revisará tu cuenta y asignará el plan que mejor se ajusta a tu negocio."}
      </p>
      <a
        href="mailto:soporte@miseby.com"
        className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
      >
        <Mail className="h-4 w-4" />
        Contactar soporte
      </a>
      <p className="mt-4 text-xs text-amber-700 opacity-70">
        Tiempo estimado de activación: 24–48 horas hábiles
      </p>
    </div>
  );
}

import { Link2 } from "lucide-react";

export function NoPlanState() {
  return (
    <div className="rounded-2xl border border-dashed border-[#94A3B8] bg-white/70 p-8 text-center text-[#475569] sm:p-12">
      <div className="mx-auto mb-4 w-fit rounded-2xl bg-[#F1F5F9] p-3">
        <Link2 className="h-6 w-6 text-[#0A2540]" />
      </div>
      <p className="text-sm font-medium text-foreground">MISE LINK no está activo</p>
      <p className="mt-1 text-xs">
        Tu negocio todavía no tiene el plan MISE LINK activo. Contactá a soporte.
      </p>
    </div>
  );
}

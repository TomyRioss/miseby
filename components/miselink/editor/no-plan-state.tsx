import { Link2 } from "lucide-react";

export function NoPlanState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
      <div className="mx-auto mb-4 w-fit rounded-xl bg-[#075296]/10 p-3">
        <Link2 className="h-6 w-6 text-[#075296]" />
      </div>
      <p className="text-sm font-medium text-foreground">MISE LINK no está activo</p>
      <p className="mt-1 text-xs">
        Tu negocio todavía no tiene el plan MISE LINK activo. Contactá a soporte.
      </p>
    </div>
  );
}

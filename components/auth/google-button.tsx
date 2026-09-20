"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <span aria-hidden className="flex h-4 w-4 items-center justify-center text-sm font-bold">
      G
    </span>
  );
}

export function GoogleButton() {
  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        disabled
        aria-disabled="true"
        title="Disponible próximamente"
        className="relative flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold opacity-70"
      >
        <GoogleIcon />
        Continuar con Google
        <Badge variant="secondary" className="ml-1 text-[10px] font-medium">
          Próximamente
        </Badge>
      </Button>
    </div>
  );
}

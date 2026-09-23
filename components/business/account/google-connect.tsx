"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Muestra el aviso de éxito cuando Google redirige con ?google=ok. */
function GoogleOkToast() {
  const params = useSearchParams();
  const shown = useRef(false);
  useEffect(() => {
    if (params.get("google") === "ok" && !shown.current) {
      shown.current = true;
      toast.success("Tu cuenta de Google quedó conectada.");
    }
  }, [params]);
  return null;
}

export function GoogleConnect() {
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard/ajustes?google=ok" });
    } catch (err) {
      console.error("[google connect]", err);
      toast.error("No pudimos conectar con Google. Probá de nuevo.");
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <Suspense fallback={null}>
        <GoogleOkToast />
      </Suspense>
      <h2 className="font-display font-semibold">Cuenta de Google</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Conectá tu cuenta de Google para entrar más rápido.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={connect}
        disabled={busy}
        className="cursor-pointer"
      >
        {busy ? "Conectando…" : "Conectar con Google"}
      </Button>
    </section>
  );
}

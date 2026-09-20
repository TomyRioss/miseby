import Link from "next/link";
import { MiseMark } from "@/components/brand/mise-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-14 text-center">
      <MiseMark />
      <p className="font-display mt-8 text-6xl font-semibold text-[#0A2540] sm:text-7xl">
        404
      </p>
      <h1 className="mt-4 text-xl font-semibold text-foreground sm:text-2xl">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        La página que buscás no existe o fue movida. Volvé al inicio o accedé a
        tu panel.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-xl bg-[#075296] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
        >
          Ir al inicio
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-input px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
        >
          Ir al panel
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";
import { MiseMark } from "@/components/brand/mise-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#edf5fb] px-5 py-14 text-center sm:px-8">
      <div className="w-full max-w-xl bg-background px-6 py-10 sm:px-12 sm:py-14">
      <MiseMark />
      <p className="font-display mt-10 text-7xl font-bold leading-none tracking-tight text-[#0A2540] sm:text-8xl">
        404
      </p>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Página no encontrada
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        La página que buscás no existe o fue movida. Volvé al inicio o accedé a
        tu panel.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#075296] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0E88E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075296] focus-visible:ring-offset-2"
        >
          Ir al inicio
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-input px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ir al panel
        </Link>
      </div>
      </div>
    </main>
  );
}

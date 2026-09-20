import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { generateProductDescription } from "@/lib/mise-ia/llm";

const DescribeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  itemWord: z.string().trim().max(20).optional(),
  businessName: z.string().trim().max(120).optional(),
});

/** Autogenera la descripción corta de un producto/plato con Mise IA. */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = DescribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Nombre inválido" }, { status: 400 });
    }
    const result = await generateProductDescription(parsed.data);
    if (!result.text) {
      return NextResponse.json(
        { ok: false, error: "La IA no está disponible ahora. Probá de nuevo." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, text: result.text });
  } catch (e) {
    console.error("[mise-ia describe]", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { generateProductDescription } from "@/lib/mise-ia/llm";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { allowRequest } from "@/lib/security/rate-limit";
import { isSameOriginRequest, readJsonBody } from "@/lib/security/request-body";

const DescribeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  itemWord: z.string().trim().max(20).optional(),
  businessName: z.string().trim().max(120).optional(),
});

/** Autogenera la descripción corta de un producto/plato con Mise IA. */
export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    if (!(await allowRequest("ai-description", user.id, 60, 3600))) return NextResponse.json({ ok: false, error: "Límite de solicitudes alcanzado. Probá más tarde." }, { status: 429 });
    const own = await getOrganizationForMember(user.id);
    if (!own?.membership || own.organization.status !== "active" || !["mise", "mise_restaurant"].includes(own.membership.plan.code)) {
      return NextResponse.json({ ok: false, error: "Sin permiso para generar descripciones" }, { status: 403 });
    }
    const body = await readJsonBody(req).catch(() => null);
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

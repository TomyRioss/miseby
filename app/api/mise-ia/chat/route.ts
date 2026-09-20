import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { getRestaurantData } from "@/lib/restaurant-theme";
import { recommendDishes } from "@/lib/mise-ia/recommender";

const ChatSchema = z.object({
  message: z.string().min(1).max(300),
  history: z
    .array(z.object({ role: z.enum(["user", "ia"]), text: z.string().max(300) }))
    .max(10)
    .optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    const body = await req.json().catch(() => null);
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Mensaje inválido" }, { status: 400 });
    }

    const [orgData, page] = await Promise.all([
      getOrganizationForMember(user.id),
      getOrCreateMiseLinkPage(user.id),
    ]);
    const menuSlug = orgData?.organization?.slug;
    if (!menuSlug) {
      return NextResponse.json({ ok: false, error: "Negocio sin menú público" }, { status: 404 });
    }
    const rest = getRestaurantData(page.theme);

    if (!rest.ia?.isActive) {
      return NextResponse.json({ ok: false, error: "La IA está inactiva" }, { status: 403 });
    }

    const businessName = rest.appearance?.restaurantName ?? "";
    const result = recommendDishes(parsed.data.message, {
      products: rest.products ?? [],
      categories: rest.categories ?? [],
      focus: rest.ia?.whatToRecommend ?? "",
      tone: rest.ia?.customInstructions ?? "",
      businessName,
    });

    const dishes = result.dishes.map((d) => ({
      ...d,
      url: `/menu/${menuSlug}#prod-${d.id}`,
    }));

    return NextResponse.json({
      ok: true,
      reply: result.reply,
      dishes,
      business: { name: businessName, hours: rest.hours ?? "", whatsapp: rest.whatsapp ?? "" },
    });
  } catch (e) {
    console.error("[mise-ia chat]", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

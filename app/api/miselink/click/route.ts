import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ClickSchema = z.object({ id: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = ClickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await prisma.miseLinkItem.update({
      where: { id: parsed.data.id },
      data: { clickCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("click track failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

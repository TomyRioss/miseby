import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { allowPublicRequest } from "@/lib/security/rate-limit";
import { isSameOriginRequest, readJsonBody } from "@/lib/security/request-body";

const ClickSchema = z.object({ id: z.string().uuid() });

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) return NextResponse.json({ ok: false }, { status: 403 });
    if (!(await allowPublicRequest(req, "click", "all", 600, 60))) return NextResponse.json({ ok: false }, { status: 429 });
    const body = await readJsonBody(req, 1024).catch(() => null);
    const parsed = ClickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const item = await prisma.miseLinkItem.findUnique({ where: { id: parsed.data.id }, include: { page: { select: { published: true, organizationId: true } } } });
    const now = new Date();
    if (!item?.active || !item.page.published || (item.scheduledStart && item.scheduledStart > now) || (item.scheduledEnd && item.scheduledEnd <= now)) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    const organization = await prisma.organization.findUnique({ where: { id: item.page.organizationId }, select: { status: true } });
    if (organization?.status !== "active") return NextResponse.json({ ok: false }, { status: 404 });
    if (!(await allowPublicRequest(req, "click-item", item.id, 120, 10))) return NextResponse.json({ ok: false }, { status: 429 });
    await prisma.miseLinkItem.updateMany({
      where: { id: item.id, active: true },
      data: { clickCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("click track failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

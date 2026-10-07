import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { allowPublicRequest } from "@/lib/security/rate-limit";
import { readBodyBytes } from "@/lib/security/request-body";

export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  if (!(await allowPublicRequest(request, "auth-ingress", "all", 200, 40))) {
    return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 });
  }
  try {
    const bytes = await readBodyBytes(request);
    const boundedRequest = new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    });
    return handlers.POST(boundedRequest);
  } catch {
    return NextResponse.json({ error: "Solicitud inválida o demasiado grande" }, { status: 413 });
  }
}

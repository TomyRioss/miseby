import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { createHash } from "node:crypto";

const limiters = new Map<string, RateLimiterMemory>();

/** Process-local quotas. Configure a shared store before scaling to multiple instances. */
export async function allowRequest(scope: string, key: string, points: number, duration: number) {
  const configuration = `${scope}:${points}:${duration}`;
  let limiter = limiters.get(configuration);
  if (!limiter) {
    limiter = new RateLimiterMemory({ points, duration });
    limiters.set(configuration, limiter);
  }
  try {
    await limiter.consume(createHash("sha256").update(key).digest("hex"));
    return true;
  } catch (error) {
    if (error instanceof RateLimiterRes) return false;
    throw error;
  }
}

/** Only use a header explicitly configured and overwritten by the deployment proxy. */
export function trustedClientIp(headers: Headers) {
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  if (!header) return null;
  return headers.get(header)?.split(",")[0]?.trim().slice(0, 128) || null;
}

export async function allowPublicRequest(request: Request, scope: string, resource: string, resourcePoints: number, ipPoints: number) {
  if (!(await allowRequest(`${scope}-global`, "all", resourcePoints * 10, 60))) return false;
  if (!(await allowRequest(`${scope}-resource`, resource, resourcePoints, 60))) return false;
  const ip = trustedClientIp(request.headers);
  return !ip || allowRequest(`${scope}-ip`, `${ip}:${resource}`, ipPoints, 60);
}

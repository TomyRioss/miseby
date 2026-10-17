import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getServerlessDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value || !process.env.VERCEL) return undefined;

  const url = new URL(value);
  if (!url.hostname.endsWith(".pooler.supabase.com")) return undefined;

  // Supabase transaction pooler for serverless; one client connection per warm instance.
  url.port = "6543";
  url.searchParams.set("pgbouncer", "true");
  url.searchParams.set("connection_limit", "1");
  return url.toString();
}

const serverlessDatabaseUrl = getServerlessDatabaseUrl();

export const prisma = globalForPrisma.prisma ?? (serverlessDatabaseUrl
  ? new PrismaClient({ datasourceUrl: serverlessDatabaseUrl })
  : new PrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

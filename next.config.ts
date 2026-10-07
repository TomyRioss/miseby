import type { NextConfig } from "next";

// Google OAuth (TOM-203): el provider en auth.ts solo se activa con
// GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET. Acá se expone la misma señal al
// FE vía NEXT_PUBLIC_GOOGLE_ENABLED="1" (solo cuando está activo).
// El FE debe leer: process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1".
const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
      ],
    }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ccoxxxvxmbrwaxlopvxz.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
  experimental: {
    // Fotos de producto: la UI promete máx 20 MB vía FormData en server action.
    // El default de Next (1 MB) rechazaba el body antes de llegar a la action
    // y la UI solo mostraba "No se pudo subir la foto." sin causa.
    serverActions: { bodySizeLimit: "21mb" },
  },
  env: {
    ...(googleEnabled ? { NEXT_PUBLIC_GOOGLE_ENABLED: "1" } : {}),
  },
};

export default nextConfig;

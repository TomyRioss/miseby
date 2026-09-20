import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Fotos de producto: la UI promete máx 5 MB vía FormData en server action.
    // El default de Next (1 MB) rechazaba el body antes de llegar a la action
    // y la UI solo mostraba "No se pudo subir la foto." sin causa.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;

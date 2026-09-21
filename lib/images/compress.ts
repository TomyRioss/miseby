"use client";

// Compresión client-side a WebP vía canvas (sin dependencias).
// Todo lo que sube el usuario se convierte a WebP salvo el logo,
// que conserva su formato original por pedido explícito.

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isAcceptedImage(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load"));
    img.src = src;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode"))),
      "image/webp",
      quality,
    );
  });
}

/** Redimensiona (manteniendo aspecto) y convierte a WebP. */
export async function compressToWebp(
  file: File,
  opts: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  const { maxDim = 1600, quality = 0.82 } = opts;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, outW, outH);
    let blob: Blob;
    try {
      blob = await canvasToWebp(canvas, quality);
    } catch {
      // Fallback: navegador sin soporte WebP → JPEG.
      const fb = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
      if (!fb) throw new Error("encode");
      blob = fb;
    }
    const name = file.name.replace(/\.[a-z0-9]+$/i, "") || "imagen";
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${name}.${ext}`, { type: blob.type });
  } finally {
    URL.revokeObjectURL(url);
  }
}

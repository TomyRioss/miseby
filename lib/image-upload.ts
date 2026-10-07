import "server-only";
import sharp from "sharp";

export const MAX_IMAGE_PIXELS = 16_000_000;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export function matchesImageType(bytes: Uint8Array, contentType: string): boolean {
  if (contentType === "image/jpeg") {
    return bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= 24 && signature.every((value, index) => bytes[index] === value);
  }
  if (contentType === "image/webp") {
    return bytes.length >= 16 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return false;
}

/** Decode fully and rebuild raster data; never persist the original payload. */
export async function normalizeUploadedImage(bytes: Uint8Array, contentType: string): Promise<Buffer | null> {
  if (bytes.length > MAX_IMAGE_BYTES || !matchesImageType(bytes, contentType)) return null;
  try {
    const format = contentType === "image/jpeg" ? "jpeg" : contentType === "image/png" ? "png" : "webp";
    const image = sharp(bytes, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning", animated: false });
    const metadata = await image.metadata();
    if (metadata.format !== format || !metadata.width || !metadata.height ||
        metadata.width * metadata.height > MAX_IMAGE_PIXELS || (metadata.pages ?? 1) > 1) return null;
    // Sharp strips EXIF, ICC, XMP and trailing content unless explicitly retained.
    const normalized = await image.rotate().toFormat(format).toBuffer();
    return normalized.length <= MAX_IMAGE_BYTES ? normalized : null;
  } catch {
    return null;
  }
}

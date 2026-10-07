import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import sharp from "sharp";
import ts from "typescript";

// Isolate server-only marker; load the real decoder without app or DB imports.
const nativeRequire = createRequire(import.meta.url);
const source = readFileSync(new URL("../../lib/image-upload.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const isolatedModule = { exports: {} };
new Function("require", "module", "exports", compiled)((name: string) => {
  if (name === "server-only") return {};
  if (name === "sharp") return nativeRequire(name);
  throw new Error(`Unexpected image helper import: ${name}`);
}, isolatedModule, isolatedModule.exports);
const { normalizeUploadedImage } = isolatedModule.exports as {
  normalizeUploadedImage(bytes: Uint8Array, contentType: string): Promise<Buffer | null>;
};

for (const format of ["jpeg", "png", "webp"] as const) {
  test(`valid ${format} is decoded and rebuilt with metadata and trailing content removed`, async () => {
    const original = await sharp({ create: { width: 12, height: 10, channels: 3, background: "red" } })
      .withMetadata().toFormat(format).toBuffer();
    const marker = Buffer.from("<script>untrusted trailing content</script>");
    const normalized = await normalizeUploadedImage(Buffer.concat([original, marker]), `image/${format}`);
    assert.ok(normalized);
    assert.equal(normalized.includes(marker), false);
    const metadata = await sharp(normalized).metadata();
    assert.equal(metadata.format, format);
    assert.equal(metadata.width, 12);
    assert.equal(metadata.height, 10);
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.icc, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.equal((await sharp(normalized).raw().toBuffer()).length, 12 * 10 * 3);
  });
}

test("HTML, SVG, spoofed MIME, signatures without image data and truncated images are rejected", async () => {
  const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "blue" } }).png().toBuffer();
  const invalid: Array<[Buffer, string]> = [
    [Buffer.from("<html><script>alert(1)</script></html>"), "image/jpeg"],
    [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "image/svg+xml"],
    [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), "image/png"],
    [png, "image/jpeg"],
    [png.subarray(0, 24), "image/png"],
    [png.subarray(0, png.length - 25), "image/png"],
    [Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]), "image/jpeg"],
    [Buffer.from("RIFF0000WEBPnot real image"), "image/webp"],
    [Buffer.alloc(0), "image/png"],
  ];
  for (const [bytes, mime] of invalid) assert.equal(await normalizeUploadedImage(bytes, mime), null, mime);
});

test("compressed image above pixel budget and upload above byte budget are rejected", async () => {
  const bomb = await sharp({ create: { width: 5000, height: 4000, channels: 3, background: "white" } })
    .png({ compressionLevel: 9 }).toBuffer();
  assert.ok(bomb.length < 1024 * 1024);
  assert.equal(await normalizeUploadedImage(bomb, "image/png"), null);
  const oversized = Buffer.alloc(20 * 1024 * 1024 + 1);
  oversized.set([0xff, 0xd8, 0xff]);
  assert.equal(await normalizeUploadedImage(oversized, "image/jpeg"), null);
});

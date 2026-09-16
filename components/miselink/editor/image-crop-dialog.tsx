"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

async function toCroppedFile(imageSrc: string, pixels: Area, outW: number, outH: number): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("load"));
    i.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, outW, outH);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("crop");
  return new File([blob], "crop.jpg", { type: "image/jpeg" });
}

export function ImageCropDialog({
  open,
  onOpenChange,
  image,
  aspect,
  round = false,
  title,
  hint,
  output,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  image: string;
  aspect: number;
  round?: boolean;
  title: string;
  hint?: string;
  output: { width: number; height: number };
  onDone: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!pixels || !image) return;
    setError("");
    setSaving(true);
    try {
      const file = await toCroppedFile(image, pixels, output.width, output.height);
      onDone(file);
    } catch (e) {
      console.error("[crop] no se pudo recortar", e);
      setError("No se pudo recortar. Probá con otra imagen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {hint ? <p className="text-center text-xs text-muted-foreground">{hint}</p> : null}
          <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black">
            {image ? (
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                cropShape={round ? "round" : "rect"}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : null}
          </div>
          <label className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border"
              aria-label="Zoom"
            />
          </label>
          {error && <p className="text-center text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1 rounded-full" onClick={handleConfirm} disabled={saving || !pixels}>
              {saving ? "Guardando…" : "Guardar recorte"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

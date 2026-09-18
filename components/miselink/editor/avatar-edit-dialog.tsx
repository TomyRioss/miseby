"use client";

import { useEffect, useRef, useState } from "react";

import { FaUser } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";
import { uploadAvatarAction, uploadBannerAction } from "@/lib/actions/avatar";
import { ImageCropDialog } from "./image-crop-dialog";

type State = ReturnType<typeof useMiseLinkState>;

export function AvatarEditDialog({
  state,
  children,
}: {
  state: State;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const [bannerCropSrc, setBannerCropSrc] = useState<string | null>(null);

  const preview = localPreview || state.page.avatarUrl || "";
  const theme = (
    state.page as {
      theme?: {
        bannerVisible?: boolean;
        bannerImage?: string;
        bannerFade?: number;
        wallpaper?: string;
        colors?: { background?: string };
        wallpaperGradient?: { from?: string };
      };
    }
  ).theme;
  const bannerVisible = theme?.bannerVisible === true;
  const bannerImage = bannerPreview || theme?.bannerImage || "";
  const serverFade = typeof theme?.bannerFade === "number" ? theme.bannerFade : 75;
  const meltColor =
    theme?.wallpaper === "gradient"
      ? (theme?.wallpaperGradient?.from ?? theme?.colors?.background ?? "#f4f1ea")
      : (theme?.colors?.background ?? "#f4f1ea");

  const [fadeUI, setFadeUI] = useState(serverFade);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setFadeUI(serverFade);
  }, [serverFade, open]);
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);
  const queueFadeSave = (v: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void state.saveTheme({ bannerFade: v });
    }, 600);
  };
  const flushFadeSave = (v: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    void state.saveTheme({ bannerFade: v });
  };

  const openAvatarCrop = (url: string) => {
    setError("");
    setAvatarCropSrc(url);
  };

  const openBannerCrop = (url: string) => {
    setBannerError("");
    setBannerCropSrc(url);
  };

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) {
      setError("");
      setBannerError("");
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setBannerPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Solo JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Máximo 5 MB.");
      return;
    }
    setError("");
    openAvatarCrop(URL.createObjectURL(file));
  };

  const uploadCroppedAvatar = async (file: File) => {
    setAvatarCropSrc(null);
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAvatarAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const ok = await state.saveProfile({ avatarUrl: res.url });
      if (ok) setOpen(false);
      else setError("Subida ok, pero no se pudo guardar. Probá de nuevo.");
    } catch (e) {
      console.error("[avatar-edit] upload", e);
      setError("No se pudo subir la foto. Probá de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const handleBannerFile = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setBannerError("Solo JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBannerError("Máximo 5 MB. Ideal 1200x400.");
      return;
    }
    setBannerError("");
    openBannerCrop(URL.createObjectURL(file));
  };

  const uploadCroppedBanner = async (file: File) => {
    setBannerCropSrc(null);
    setBannerPreview(URL.createObjectURL(file));
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadBannerAction(fd);
      if (!res.ok) {
        setBannerError(res.error);
        return;
      }
      const ok = await state.saveTheme({ bannerImage: res.url, bannerVisible: true });
      if (!ok) setBannerError("Subida ok, pero no se pudo guardar. Probá de nuevo.");
    } catch (e) {
      console.error("[banner-edit] upload", e);
      setBannerError("No se pudo subir el banner. Probá de nuevo.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerToggle = async (v: boolean) => {
    setBannerError("");
    await state.saveTheme({ bannerVisible: v });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Foto de perfil</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          <Avatar className="size-24">
            {preview ? <AvatarImage src={preview} alt="" /> : null}
            <AvatarFallback>
              <FaUser className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <label
            className={`w-full cursor-pointer rounded-full border border-dashed border-border px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploading ? "Subiendo…" : "Subir desde el dispositivo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading || saving}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {preview ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-full"
              disabled={uploading || saving}
              onClick={() => openAvatarCrop(preview)}
            >
              Recortar foto actual
            </Button>
          ) : null}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {state.page.avatarUrl ? (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              disabled={saving || uploading}
              onClick={async () => {
                setError("");
                setSaving(true);
                try {
                  const ok = await state.saveProfile({ avatarUrl: "" });
                  if (ok) setOpen(false);
                  else setError("No se pudo quitar la foto.");
                } catch (e) {
                  console.error("[avatar-edit] quitar", e);
                  setError("No se pudo quitar la foto.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Quitar foto
            </Button>
          ) : null}
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Banner detrás del avatar</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Portada 100% ancho. Ideal 1200×400.
              </p>
            </div>
            <Switch checked={bannerVisible} onCheckedChange={handleBannerToggle} aria-label="Mostrar banner" />
          </div>

          {bannerVisible || bannerImage ? (
            <div
              className="mt-4 overflow-hidden rounded-2xl border border-border"
              style={{ background: meltColor }}
            >
              <div className="relative aspect-[3/1] w-full overflow-hidden bg-gradient-to-r from-[#0a2540] via-[#134e7a] to-[#00b4d8]">
                {bannerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerImage} alt="" className="h-full w-full object-cover object-center" />
                ) : null}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/25 via-black/5 to-transparent" />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(to bottom, rgba(0,0,0,0) ${100 - fadeUI}%, ${meltColor} 100%)`,
                  }}
                />
                <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
                  <Avatar className="size-24 ring-4 ring-white shadow-xl">
                    {preview ? <AvatarImage src={preview} alt="" /> : null}
                    <AvatarFallback>
                      <FaUser className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="flex flex-col gap-3 px-3 pb-3 pt-14">
                <div className="rounded-xl bg-background px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="banner-fade" className="text-xs font-semibold text-foreground">
                      Fundido con el fondo
                    </label>
                    <span className="text-xs tabular-nums text-muted-foreground">{fadeUI}%</span>
                  </div>
                  <input
                    id="banner-fade"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={fadeUI}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setFadeUI(v);
                      queueFadeSave(v);
                    }}
                    onPointerUp={(e) => flushFadeSave(Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => flushFadeSave(Number((e.target as HTMLInputElement).value))}
                    onBlur={(e) => flushFadeSave(Number((e.target as HTMLInputElement).value))}
                    className="mt-2 w-full accent-foreground"
                    aria-label="Intensidad del fundido del banner"
                  />
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    0 = corte recto, 100 = fundido total.
                  </p>
                </div>
                <label
                  className={`w-full cursor-pointer rounded-full border border-dashed border-border bg-background px-4 py-2 text-center text-xs font-semibold transition-colors hover:bg-muted ${uploadingBanner ? "pointer-events-none opacity-60" : ""}`}
                >
                  {uploadingBanner ? "Subiendo banner…" : bannerImage ? "Cambiar banner" : "Subir banner"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingBanner}
                    onChange={(e) => handleBannerFile(e.target.files?.[0])}
                  />
                </label>
                {bannerImage ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full rounded-full text-xs"
                    disabled={uploadingBanner}
                    onClick={() => openBannerCrop(bannerImage)}
                  >
                    Recortar banner actual
                  </Button>
                ) : null}
                {bannerError && <p className="text-center text-xs text-red-600">{bannerError}</p>}
                {theme?.bannerImage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-full text-xs text-muted-foreground hover:text-foreground"
                    disabled={uploadingBanner}
                    onClick={async () => {
                      setBannerError("");
                      const ok = await state.saveTheme({ bannerImage: "", bannerVisible: false });
                      if (!ok) setBannerError("No se pudo quitar el banner.");
                    }}
                  >
                    Quitar banner
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
    <ImageCropDialog
      open={!!avatarCropSrc}
      onOpenChange={(v) => { if (!v) setAvatarCropSrc(null); }}
      image={avatarCropSrc ?? ""}
      aspect={1}
      round
      title="Recortar foto"
      hint="Arrastra y usa zoom. Salida cuadrada."
      output={{ width: 512, height: 512 }}
      onDone={uploadCroppedAvatar}
    />
    <ImageCropDialog
      open={!!bannerCropSrc}
      onOpenChange={(v) => { if (!v) setBannerCropSrc(null); }}
      image={bannerCropSrc ?? ""}
      aspect={3}
      title="Recortar banner"
      hint="Proporción 3:1. Ideal 1200×400."
      output={{ width: 1200, height: 400 }}
      onDone={uploadCroppedBanner}
    />
    </>
  );
}

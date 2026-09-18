"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { SiWhatsapp, SiX, SiFacebook, SiTelegram } from "react-icons/si";
import { FiShare2 } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  displayName: string | null;
  baseUrl?: string;
};

// ponytail: solo plataformas con intent de compartir link real por web.
// Instagram/TikTok/YouTube no exponen share URL para links arbitrarios.
const PLATFORMS = [
  { label: "WhatsApp", icon: SiWhatsapp, color: "#25D366", href: (u: string) => `https://wa.me/?text=${encodeURIComponent(u)}` },
  { label: "X", icon: SiX, color: "#000000", href: (u: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}` },
  { label: "Facebook", icon: SiFacebook, color: "#1877F2", href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { label: "Telegram", icon: SiTelegram, color: "#26A5E4", href: (u: string) => `https://t.me/share/url?url=${encodeURIComponent(u)}` },
];

export function ShareDialog({
  open,
  onOpenChange,
  username,
  displayName,
  baseUrl = "miseby.com",
}: Props) {
  const [copied, setCopied] = useState(false);
  const publicUrl = `${baseUrl}/${username}`;
  const fullUrl = `https://${publicUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Enlace copiado");
    } catch (e) {
      console.error("No se pudo copiar el enlace", e);
      toast.error("No se pudo copiar el enlace");
    }
  };

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName ?? `@${username}`, url: fullUrl });
      } else {
        await copy();
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error("Error al compartir", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir</DialogTitle>
          <DialogDescription className="sr-only">
            Compartí tu página pública de MiseLink
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-border p-2 pl-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded bg-foreground text-[11px] font-bold text-background">
            {(displayName ?? username).charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 truncate text-sm">{publicUrl}</span>
          <Button size="sm" onClick={copy}>
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-5">
          <QRCodeCanvas value={fullUrl} size={148} marginSize={2} className="rounded" />
          <div className="text-center">
            <p className="font-medium">Agregá el link a tu bio de Instagram</p>
            <p className="text-sm text-muted-foreground">Escaneá con tu teléfono</p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-3 text-sm font-medium">Compartir en</p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {/* ponytail: scroll horizontal, evita wrap al crecer la lista */}
            <button
              type="button"
              onClick={nativeShare}
              className="cursor-pointer flex w-16 shrink-0 flex-col items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
                <FiShare2 className="size-5" />
              </span>
              Más
            </button>
            {PLATFORMS.map((p) => (
              <a
                key={p.label}
                href={p.href(fullUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer flex w-16 shrink-0 flex-col items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <p.icon className="size-5" style={{ color: p.color }} />
                </span>
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

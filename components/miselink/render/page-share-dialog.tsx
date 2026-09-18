"use client";

import { FaUser } from "react-icons/fa6";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShareTargetsRow } from "./share-targets";

export function PageShareDialog({
  open,
  onOpenChange,
  username,
  avatarUrl,
  displayName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  avatarUrl: string | null;
  displayName: string | null;
}) {
  const handle = `@${username}`;
  const publicUrl = `miseby.com/${username}`;
  const fullUrl = `https://${publicUrl}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-[15px] font-semibold">
            Compartir Miseby
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 rounded-3xl bg-[#2B2B33] px-6 py-8 text-center">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/20">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={handle} className="h-full w-full object-cover" />
            ) : (
              <FaUser className="h-9 w-9 text-white/80" aria-hidden />
            )}
          </span>
          <div>
            <p className="text-xl font-extrabold text-white">{handle}</p>
            <p className="mt-0.5 text-sm text-white/70">
              ✳/{username}
            </p>
          </div>
        </div>

        <ShareTargetsRow url={fullUrl} title={displayName?.trim() || handle} />

        <div className="border-t border-border pt-4">
          <p className="text-[15px] font-bold text-foreground">
            Únete a {handle} en Miseby
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá tu propio Miseby gratis. El único enlace en bio en el que confían miles de
            personas.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="/register"
              className="cursor-pointer flex-1 rounded-full bg-black px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Regístrate gratis
            </a>
            <a
              href="/"
              className="cursor-pointer flex-1 rounded-full border border-border px-4 py-2.5 text-center text-sm font-semibold text-foreground"
            >
              Descubre más
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

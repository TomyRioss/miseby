"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShareTargetsRow } from "./share-targets";

export function LinkShareDialog({
  open,
  onOpenChange,
  title,
  url,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
}) {
  const short = url.replace(/^https?:\/\//i, "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-[15px] font-semibold">
            Compartir enlace
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-2xl bg-muted px-6 py-8 text-center">
          <p className="text-lg font-extrabold text-foreground">{title}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{short}</p>
        </div>

        <ShareTargetsRow url={url} title={title} />
      </DialogContent>
    </Dialog>
  );
}

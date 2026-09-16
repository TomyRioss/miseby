"use client";

import { useState } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { toast } from "sonner";
import type { RenderItem } from "./types";
import { themeButtonClass, type MiseLinkTheme } from "@/lib/miselink/theme";
import { LinkShareDialog } from "./link-share-dialog";

export function MiseLinkButton({
  item,
  theme,
  showOptions = true,
}: {
  item: RenderItem;
  theme?: MiseLinkTheme;
  showOptions?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  if (!item.url || !item.title) return null;

  const style = theme?.buttonStyle ?? "fill";
  const btnBg = theme?.colors.button ?? "#ffffff";
  const btnFg = theme?.colors.buttonText ?? "#171717";
  const outline = style === "outline";

  function trackClick() {
    try {
      const payload = JSON.stringify({ id: item.id });
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/miselink/click", blob);
      } else {
        void fetch("/api/miselink/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch((e) => console.error("click track failed", e));
      }
    } catch (e) {
      console.error("click track failed", e);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(item.url as string);
      toast.success("Enlace copiado");
    } catch (e) {
      console.error("copy link failed", e);
      toast.error("No se pudo copiar el enlace");
    } finally {
      setOpen(false);
    }
  }

  return (
    <div className="relative w-full">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={trackClick}
        style={
          outline
            ? { borderColor: btnBg, color: btnFg, background: "transparent" }
            : { background: btnBg, color: btnFg, borderColor: "transparent" }
        }
        className={`flex min-h-[56px] w-full items-center justify-center border-2 px-12 py-4 text-center text-[15px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-transform hover:scale-[1.01] active:scale-[0.99] ${themeButtonClass(style)}`}
      >
        {item.title}
      </a>
      {showOptions ? (
        <button
          type="button"
          aria-label={`Opciones para ${item.title}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ color: btnFg }}
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
        >
          <FiMoreVertical className="h-5 w-5" />
        </button>
      ) : null}

      {showOptions && open ? (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default bg-transparent"
          />
          <div className="absolute right-2 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
            <button
              onClick={copyLink}
              className="block w-full px-4 py-3 text-left text-sm text-neutral-900 hover:bg-neutral-100"
            >
              Copiar enlace
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setShareOpen(true);
              }}
              className="block w-full px-4 py-3 text-left text-sm text-neutral-900 hover:bg-neutral-100"
            >
              Compartir
            </button>
          </div>
        </>
      ) : null}
      <LinkShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title={item.title}
        url={item.url}
      />
    </div>
  );
}

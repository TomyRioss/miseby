"use client";

import { useState } from "react";
import { FaLink, FaCheck, FaLinkedin } from "react-icons/fa6";
import { SiX, SiFacebook, SiWhatsapp, SiTelegram } from "react-icons/si";
import { toast } from "sonner";

export function ShareTargetsRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("copy link failed", e);
      toast.error("No se pudo copiar el enlace");
    }
  };

  const eu = encodeURIComponent(url);
  const et = encodeURIComponent(title);
  const targets = [
    {
      label: "X",
      icon: SiX,
      bg: "#000000",
      href: `https://twitter.com/intent/tweet?url=${eu}&text=${et}`,
    },
    {
      label: "Facebook",
      icon: SiFacebook,
      bg: "#1877F2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${eu}`,
    },
    {
      label: "WhatsApp",
      icon: SiWhatsapp,
      bg: "#25D366",
      href: `https://wa.me/?text=${et}%20${eu}`,
    },
    {
      label: "LinkedIn",
      icon: FaLinkedin,
      bg: "#0A66C2",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${eu}`,
    },
    {
      label: "Telegram",
      icon: SiTelegram,
      bg: "#26A5E4",
      href: `https://t.me/share/url?url=${eu}&text=${et}`,
    },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={copy}
        className="cursor-pointer flex w-16 shrink-0 flex-col items-center gap-1.5 text-[11px] text-muted-foreground"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-[#E9E9EE] text-neutral-800">
          {copied ? <FaCheck className="size-5" /> : <FaLink className="size-5" />}
        </span>
        {copied ? "Copiado" : "Copiar enlace"}
      </button>
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer flex w-16 shrink-0 flex-col items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span
            className="flex size-12 items-center justify-center rounded-full"
            style={{ backgroundColor: t.bg }}
          >
            <t.icon className="size-5 text-white" />
          </span>
          {t.label}
        </a>
      ))}
    </div>
  );
}

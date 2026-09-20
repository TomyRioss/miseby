"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";

type Dish = { id: string; name: string; price: number; imageUrl: string | null; url: string; category: string };
type Msg = { role: "user" | "ia"; text: string; dishes?: Dish[] };

const SUGGESTIONS = ["¿Qué me recomendás liviano?", "¿Qué postre pido?", "Somos 2, ¿qué pedimos?"] as const;

function formatPrice(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

export function MeseroWidget({
  slug,
  restaurantName,
  accent = "#6D28D9",
}: {
  slug: string;
  restaurantName: string;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<Msg[]>([]);
  const [msg, setMsg] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat, typing, open]);

  async function send(text?: string) {
    const value = (text ?? msg).trim().slice(0, 300);
    if (!value || typing) return;
    const history = [...chat.map((m) => ({ role: m.role, text: m.text })), { role: "user" as const, text: value }];
    setChat((c) => [...c, { role: "user", text: value }]);
    setMsg("");
    setTyping(true);
    try {
      const res = await fetch(`/api/menu/${encodeURIComponent(slug)}/mesero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, history: history.slice(-8) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const err = res.status === 429 ? (data?.error ?? "Esperá un minuto") : (data?.error ?? "No se pudo enviar");
        toast.error(err);
        setChat((c) => [...c, { role: "ia", text: "Perdón, tuve un problema. Probá de nuevo en un momento." }]);
        return;
      }
      setChat((c) => [...c, { role: "ia", text: data.reply, dishes: data.dishes ?? [] }]);
    } catch (e) {
      console.error("[mesero widget]", e);
      setChat((c) => [...c, { role: "ia", text: "Sin conexión. Revisá tu internet y probá de nuevo." }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          role="dialog"
          aria-label={`Mesero de ${restaurantName}`}
          className="flex h-[min(32rem,70dvh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3" style={{ backgroundColor: `${accent}14` }}>
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: accent }}
            >
              <MessageCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Mesero · {restaurantName}</p>
              <p className="text-xs text-muted-foreground">Te recomiendo de la carta</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div aria-live="polite" className="flex-1 space-y-2.5 overflow-y-auto bg-muted/60 p-3">
            {chat.length === 0 && !typing && (
              <div className="space-y-2 py-2 text-center">
                <p className="text-[13px] font-medium">¿Qué antojo tenés hoy?</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SUGGESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="cursor-pointer rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-muted"
                    >
                      “{q}”
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <p
                  className={`max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === "user" ? "rounded-br-md bg-[#0A2540] text-white" : "rounded-bl-md border border-border bg-background"
                  }`}
                >
                  {m.text}
                </p>
                {(m.dishes ?? []).length > 0 && (
                  <div className="mt-1.5 grid w-full gap-1.5">
                    {m.dishes!.slice(0, 3).map((d) => (
                      <a
                        key={d.id}
                        href={d.url}
                        onClick={() => setOpen(false)}
                        className="cursor-pointer flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left shadow-sm hover:bg-muted"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold">{d.name}</span>
                          <span className="block text-xs text-muted-foreground">{d.category}</span>
                        </span>
                        <span className="shrink-0 text-[13px] font-bold" style={{ color: accent }}>
                          {formatPrice(d.price)}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div role="status" aria-label="El mesero está escribiendo" className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-background px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} aria-hidden className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value.slice(0, 300))}
              placeholder="Preguntale al mesero…"
              aria-label="Preguntale al mesero"
              maxLength={300}
              className="min-w-0 flex-1 rounded-full border border-input bg-background px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
            />
            <button
              type="submit"
              disabled={!msg.trim() || typing}
              aria-label="Enviar"
              className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Cerrar mesero" : "Hablar con el mesero"}
        className="cursor-pointer flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-105"
        style={{ backgroundColor: accent }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

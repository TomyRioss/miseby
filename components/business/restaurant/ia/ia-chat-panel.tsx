"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, MessageCircle, RotateCcw, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CHAT_LIMIT, QUICK_SUGGESTIONS, type ChatMsg } from "./ia-helpers";

type Props = { isActive: boolean; menuSummary: string; focus: string };

type RecommendedDish = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  url: string;
  category: string;
};

type ChatMsgWithDishes = ChatMsg & { dishes?: RecommendedDish[] };

type HistoryItem = { role: "user" | "ia"; text: string };

function time(ts: number) {
  return new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function formatPrice(price: number) {
  if (!Number.isFinite(price)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}

function TypingDots() {
  return (
    <div aria-label="El mesero está pensando" role="status" className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-background px-3.5 py-3">
      <span className="flex items-center gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </span>
      <span className="text-xs text-muted-foreground">Pensando…</span>
    </div>
  );
}

function DishCards({ dishes }: { dishes: RecommendedDish[] }) {
  if (dishes.length === 0) return null;
  return (
    <div className="mt-2 grid max-w-[85%] grid-cols-1 gap-2 sm:grid-cols-2">
      {dishes.map((d) => (
        <div key={d.id} className="flex gap-2.5 rounded-xl border border-border bg-background p-2 shadow-sm">
          {d.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={d.imageUrl}
              alt={d.name}
              loading="lazy"
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#0A2540]/10 text-lg font-semibold text-[#0A2540]"
            >
              {(d.name || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-[13px] font-semibold leading-tight">{d.name}</p>
            {d.category && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{d.category}</p>
            )}
            <p className="mt-0.5 text-[13px] font-medium tabular-nums">{formatPrice(d.price)}</p>
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-[#6D28D9] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
            >
              Ver en carta<ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export function IaChatPanel({ isActive, menuSummary, focus }: Props) {
  void menuSummary;
  void focus;
  const [chat, setChat] = useState<ChatMsgWithDishes[]>([]);
  const [msg, setMsg] = useState("");
  const [typing, setTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [source, setSource] = useState<"ia" | "local" | null>(null);
  const [sourceDetail, setSourceDetail] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat, typing]);

  async function send(text?: string) {
    const value = (text ?? msg).trim().slice(0, CHAT_LIMIT);
    if (!value || typing) return;
    if (!isActive) {
      setSendError("Activá el mesero arriba para probar cómo responde.");
      toast.error("Activá el mesero primero para probar.");
      return;
    }
    setSendError(null);
    const history: HistoryItem[] = [
      ...chat.map((m) => ({ role: m.role, text: m.text })),
      { role: "user", text: value },
    ];
    setChat((c) => [...c, { role: "user", text: value, at: Date.now() }]);
    setMsg("");
    setTyping(true);
    try {
      const res = await fetch("/api/mise-ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, history }),
      });
      const data: {
        ok?: boolean;
        reply?: string;
        source?: "ia" | "local";
        detail?: string;
        dishes?: RecommendedDish[];
        error?: string;
      } | null = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const msgErr =
          res.status === 401
            ? "Iniciá sesión para probar el mesero."
            : res.status === 403
              ? "El mesero está en pausa. Activalo arriba para probar."
              : (data?.error ?? "No se pudo enviar. Probá de nuevo.");
        setSendError(msgErr);
        toast.error(msgErr);
        return;
      }
      setChat((c) => [
        ...c,
        {
          role: "ia",
          text: data.reply ?? "Acá estoy, ¿qué antojo tenés hoy?",
          dishes: Array.isArray(data.dishes) ? data.dishes : [],
          at: Date.now(),
        },
      ]);
      setSource(data.source ?? "local");
      setSourceDetail(data.detail ?? null);
    } catch (e) {
      console.error("[mise-ia chat]", e);
      const msgErr = "Sin conexión. Revisá tu internet y probá de nuevo.";
      setSendError(msgErr);
      toast.error(msgErr);
    } finally {
      setTyping(false);
    }
  }

  const inputDisabled = !isActive || typing;

  return (
    <Card className="flex min-h-105 flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-border pb-4">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A2540] text-white">
          <MessageCircle className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="ia-chat" className="text-base font-semibold leading-tight tracking-tight">Probalo como un cliente</h2>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">Vista previa con tu carta real</p>
        </div>
        <Badge variant={isActive ? "default" : "secondary"} className={`shrink-0 ${isActive ? "bg-emerald-600 hover:bg-emerald-600/90" : ""}`}>
          <span aria-hidden className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-muted-foreground"}`} />
          {isActive ? "En línea" : "En pausa"}
        </Badge>
        {source && (
          <span
            title={source === "ia" ? "Responde la IA (OpenRouter)" : (sourceDetail ?? "Sin IA: respuesta automática local. Revisá tu key de OpenRouter.")}
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${source === "ia" ? "bg-[#6D28D9]/10 text-[#6D28D9]" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"}`}
          >
            {source === "ia" ? "IA en vivo" : "Respuesta local"}
          </span>
        )}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preguntas de ejemplo">
          {QUICK_SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={inputDisabled}
              className="min-h-8 cursor-pointer rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-[#6D28D9]/50 hover:bg-[#6D28D9]/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              “{q}”
            </button>
          ))}
        </div>

        <div aria-live="polite" aria-label="Conversación de prueba" className="mt-3 max-h-80 min-h-48 flex-1 space-y-2.5 overflow-y-auto overscroll-contain rounded-xl bg-muted/70 p-3">
          {chat.length === 0 && !typing && (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
                <MessageCircle className="h-5 w-5" />
              </span>
              <p className="text-[13px] font-medium">Tocá una pregunta o escribí la tuya</p>
              <p className="max-w-60 text-xs leading-snug text-muted-foreground">El mesero responde solo con platos de tu carta. Si inventa algo, ajustá el foco.</p>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={`${m.at}-${i}`} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              {m.role === "ia" && <span className="mb-0.5 ml-1 text-[10px] font-medium text-muted-foreground">Mesero IA</span>}
              <p className={`max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${m.role === "user" ? "rounded-br-md bg-[#0A2540] text-white" : "rounded-bl-md border border-border bg-background"}`}>
                {m.text}
              </p>
              {m.role === "ia" && m.dishes && m.dishes.length > 0 && <DishCards dishes={m.dishes} />}
              <span className="mt-0.5 px-1 text-[10px] tabular-nums text-muted-foreground/70">{time(m.at)}</span>
            </div>
          ))}
          {typing && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        {sendError && (
          <Alert variant="destructive" role="alert" className="mt-3">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription className="flex w-full items-center justify-between gap-2">
              <span className="text-xs">{sendError}</span>
              <button type="button" onClick={() => setSendError(null)} className="cursor-pointer text-xs font-semibold underline underline-offset-2">
                Cerrar
              </button>
            </AlertDescription>
          </Alert>
        )}

        {chat.length > 0 && (
          <button
            type="button"
            onClick={() => { setChat([]); setSendError(null); }}
            className="mt-2 inline-flex cursor-pointer items-center gap-1 self-start rounded px-1 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
          >
            <RotateCcw className="h-3 w-3" />Empezar de nuevo
          </button>
        )}

        <div className="mt-2 flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={isActive ? "Escribí como cliente…" : "Activá el mesero para probar…"}
              disabled={inputDisabled}
              aria-label="Mensaje de prueba como cliente"
              maxLength={CHAT_LIMIT}
              className="min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button
            onClick={() => send()}
            disabled={inputDisabled || !msg.trim()}
            aria-label="Enviar pregunta"
            className="h-11 w-11 shrink-0 cursor-pointer rounded-xl bg-[#0A2540] p-0 hover:bg-[#0A2540]/90 disabled:cursor-not-allowed"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
        <p className="mt-1.5 flex justify-between px-1 text-[10px] tabular-nums text-muted-foreground/70" aria-live="polite">
          <span>{isActive ? "Vista previa local, no le llega a nadie." : "El chat se habilita al activar el mesero."}</span>
          {msg.length > 0 && <span>{msg.length}/{CHAT_LIMIT}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

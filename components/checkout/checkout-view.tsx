"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  Banknote,
  Bike,
  CircleCheck,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/restaurant-theme";
import { usePedido } from "@/components/menu/use-pedido";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Fulfillment = "retiro" | "delivery";
type PayMethod = "efectivo" | "transferencia";

const SUCCESS_MSG = "El local ya recibió el pedido, seguilo contactandote con el local.";

export type CheckoutViewProps = {
  slug: string;
  businessName: string;
  backHref: string;
  backLabel: string;
  emptyHint: string;
  currency?: string | null;
  whatsapp?: string | null;
  primary?: string;
  accent?: string;
  background?: string;
  text?: string;
};

/** Checkout compartido menú + catálogo: resumen en tarjeta, datos en tarjeta, CTA sticky en móvil. */
export function CheckoutView({
  slug,
  businessName,
  backHref,
  backLabel,
  emptyHint,
  currency = "COP",
  whatsapp,
  primary = "#0A2540",
  accent,
  background = "#FFFFFF",
  text = "#171717",
}: CheckoutViewProps) {
  const { items, setQty, clear, total, count } = usePedido(slug);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("retiro");
  const [pay, setPay] = useState<PayMethod>("efectivo");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const cur = currency ?? "COP";
  const priceColor = accent ?? primary;

  const sub = /^#[0-9a-fA-F]{6}$/.test(text) ? `${text}99` : "#6B7280";
  const border = /^#[0-9a-fA-F]{6}$/.test(text) ? `${text}1F` : "#E5E7EB";

  async function confirm() {
    if (items.length === 0) return toast.error("Tu pedido está vacío.");
    if (!phone.trim()) return toast.error("Ingresá tu teléfono.");
    if (fulfillment === "delivery" && !address.trim())
      return toast.error("Ingresá tu dirección para el delivery.");
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          items: items.map((x) => ({ id: x.id, name: x.name, price: x.price, qty: x.qty })),
          fulfillment,
          payMethod: pay,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerAddress: fulfillment === "delivery" ? address.trim() : "",
        }),
      });
      if (!res.ok) throw new Error(`POST /api/orders ${res.status}`);
      clear();
      setDone(true);
      toast.success("Pedido enviado.");
    } catch (e) {
      console.error("[checkout confirm]", e);
      toast.error("No se pudo enviar el pedido. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  const optionBtn = (active: boolean) =>
    `min-h-12 flex-1 cursor-pointer rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${
      active ? "text-white" : "hover:bg-muted/60"
    }`;

  const waHref = whatsapp ? `https://wa.me/${whatsapp.replace(/\D+/g, "")}` : null;

  if (done) {
    return (
      <main className="h-[100dvh] overflow-y-auto" style={{ background, color: text }}>
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <Card>
            <CardContent className="py-10 text-center">
              <span
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white"
                style={{ background: primary }}
              >
                <CircleCheck className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-2xl font-bold">¡Pedido confirmado!</h1>
              <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: sub }}>
                {SUCCESS_MSG}
              </p>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: primary }}
                >
                  Contactar por WhatsApp
                </a>
              ) : (
                <Button asChild className="mt-6 min-h-11 px-6 text-white" style={{ background: primary }}>
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] overflow-y-auto pb-28 lg:pb-8" style={{ background, color: text }}>
      <div className="mx-auto w-full max-w-4xl px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm" className="min-h-9">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <p className="truncate text-xs font-medium" style={{ color: sub }}>
            {businessName}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Tu pedido</h1>
          {count > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {count} {count === 1 ? "ítem" : "ítems"}
            </Badge>
          )}
        </div>

        {items.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </span>
              <p className="mx-auto mt-4 max-w-sm text-sm" style={{ color: sub }}>
                {emptyHint}
              </p>
              <Button asChild className="mt-6 min-h-11 px-6 text-white" style={{ background: primary }}>
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Resumen</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clear}
                  className="min-h-9 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Vaciar
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y" style={{ borderColor: border }}>
                  {items.map((x) => (
                    <li key={x.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {x.qty}x {x.name}
                        </p>
                        <p className="text-sm font-bold tabular-nums" style={{ color: priceColor }}>
                          {formatPrice(x.qty * x.price, cur)}
                        </p>
                      </div>
                      <div
                        className="flex shrink-0 items-center gap-0.5 rounded-full border p-0.5"
                        style={{ borderColor: border }}
                      >
                        <button
                          type="button"
                          onClick={() => setQty(x.id, x.qty - 1)}
                          aria-label={`Quitar uno de ${x.name}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold tabular-nums">{x.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(x.id, x.qty + 1)}
                          aria-label={`Agregar uno de ${x.name}`}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <Separator className="my-3" />
                <div className="flex items-baseline justify-between">
                  <p className="text-sm" style={{ color: sub }}>
                    Subtotal ({count} {count === 1 ? "ítem" : "ítems"})
                  </p>
                  <p className="text-sm font-semibold tabular-nums">{formatPrice(total, cur)}</p>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <p className="text-base font-bold">Total</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: priceColor }}>
                    {formatPrice(total, cur)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tus datos</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <Label htmlFor="ck-name">Nombre</Label>
                    <Input
                      id="ck-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      maxLength={60}
                      autoComplete="name"
                      className="mt-1.5 min-h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ck-phone">Teléfono *</Label>
                    <Input
                      id="ck-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Tu teléfono"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={30}
                      className="mt-1.5 min-h-11"
                    />
                  </div>
                </div>

                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold">Entrega</legend>
                  <div className="mt-1.5 flex gap-2">
                    {(
                      [
                        { id: "retiro", label: "Retiro en local", hint: "Pasás a buscar", Icon: Store },
                        { id: "delivery", label: "Delivery", hint: "Te lo llevamos", Icon: Bike },
                      ] as const
                    ).map(({ id, label, hint, Icon }) => {
                      const active = fulfillment === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setFulfillment(id)}
                          className={optionBtn(active)}
                          style={active ? { background: primary, borderColor: primary } : { borderColor: border }}
                        >
                          <span className="flex items-center gap-1.5 text-sm font-semibold">
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                          </span>
                          <span className={`mt-0.5 block text-xs ${active ? "text-white/80" : "text-muted-foreground"}`}>
                            {hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {fulfillment === "delivery" && (
                  <div className="mt-4">
                    <Label htmlFor="ck-address">Dirección *</Label>
                    <Input
                      id="ck-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, número, piso…"
                      maxLength={160}
                      autoComplete="street-address"
                      className="mt-1.5 min-h-11"
                    />
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      La usamos solo para este pedido.
                    </p>
                  </div>
                )}

                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold">Pago</legend>
                  <div className="mt-1.5 flex gap-2">
                    {(
                      [
                        { id: "efectivo", label: "Efectivo", Icon: Banknote },
                        { id: "transferencia", label: "Transferencia", Icon: ArrowLeftRight },
                      ] as const
                    ).map(({ id, label, Icon }) => {
                      const active = pay === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setPay(id)}
                          className={`${optionBtn(active)} min-h-11`}
                          style={active ? { background: primary, borderColor: primary } : { borderColor: border }}
                        >
                          <span className="flex items-center gap-1.5 text-sm font-semibold">
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <button
                  type="button"
                  onClick={confirm}
                  disabled={sending}
                  className="mt-6 hidden w-full cursor-pointer rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] disabled:cursor-wait disabled:opacity-60 lg:block"
                  style={{ background: primary }}
                >
                  {sending ? "Enviando…" : `Confirmar pedido · ${formatPrice(total, cur)}`}
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {items.length > 0 && !done && (
        <div
          className="fixed inset-x-0 bottom-0 border-t bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
          style={{ borderColor: border }}
        >
          <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs" style={{ color: sub }}>
                Total ({count} {count === 1 ? "ítem" : "ítems"})
              </p>
              <p className="truncate text-lg font-bold tabular-nums">{formatPrice(total, cur)}</p>
            </div>
            <button
              type="button"
              onClick={confirm}
              disabled={sending}
              className="min-h-12 flex-1 cursor-pointer rounded-xl px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] disabled:cursor-wait disabled:opacity-60"
              style={{ background: primary }}
            >
              {sending ? "Enviando…" : "Confirmar pedido"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/restaurant-theme";
import { usePedido } from "@/components/menu/use-pedido";

type Fulfillment = "retiro" | "delivery";
type PayMethod = "efectivo" | "mp";

const SUCCESS_MSG = "El local ya recibió el pedido, seguilo contactandote con el local.";

/** Checkout del pedido del catálogo multirubro: carrito → datos → POST /api/orders. */
export function CatalogCheckoutView({
  slug,
  currency = "COP",
  whatsapp,
  primary = "#0A2540",
  background = "#FFFFFF",
  text = "#171717",
}: {
  slug: string;
  businessName: string;
  currency?: string | null;
  whatsapp?: string | null;
  primary?: string;
  background?: string;
  text?: string;
}) {
  const { items, setQty, clear, total } = usePedido(slug);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("retiro");
  const [pay, setPay] = useState<PayMethod>("efectivo");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const cur = currency ?? "COP";

  const sub = "#6B7280";
  const border = "#E5E7EB";

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
      console.error("[catalog checkout confirm]", e);
      toast.error("No se pudo enviar el pedido. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  const pill = (active: boolean) =>
    `min-h-10 flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
      active ? "text-white" : ""
    }`;

  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/\D+/g, "")}`
    : null;

  if (done) {
    return (
      <main className="min-h-screen" style={{ background, color: text }}>
        <div className="mx-auto w-full max-w-2xl px-4 py-10 text-center">
          <h1 className="text-2xl font-bold">¡Pedido confirmado!</h1>
          <p className="mx-auto mt-4 max-w-md text-sm" style={{ color: sub }}>
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
            <Link
              href={`/catalogo/${slug}`}
              className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: primary }}
            >
              Volver al catálogo
            </Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background, color: text }}>
      <div className="mx-auto w-full max-w-2xl px-4 py-4">
        <Link
          href={`/catalogo/${slug}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-black/[0.04]"
          style={{ borderColor: border }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Tu pedido</h1>

        {items.length === 0 ? (
          <p className="mt-6 rounded-lg border px-4 py-10 text-center text-sm" style={{ borderColor: border, color: sub }}>
            Tu pedido está vacío. Volvé al catálogo y agregá un producto.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-col gap-2">
              {items.map((x) => (
                <div key={x.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5" style={{ borderColor: border }}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {x.qty}x {x.name}
                    </p>
                    <p className="text-sm font-bold" style={{ color: primary }}>{formatPrice(x.qty * x.price, cur)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setQty(x.id, x.qty - 1)} aria-label="Quitar uno" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold tabular-nums">{x.qty}</span>
                    <button type="button" onClick={() => setQty(x.id, x.qty + 1)} aria-label="Agregar uno" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06]">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={clear}
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: sub }}
            >
              <Trash2 className="h-4 w-4" />
              Vaciar carrito
            </button>
            <p className="mt-3 text-lg font-bold">Total: {formatPrice(total, cur)}</p>

            <label htmlFor="ck-name" className="mt-5 block text-sm font-semibold">Nombre</label>
            <input
              id="ck-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={60}
              className="mt-1.5 min-h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none placeholder:text-black/40"
              style={{ borderColor: border }}
            />

            <label htmlFor="ck-phone" className="mt-4 block text-sm font-semibold">Teléfono *</label>
            <input
              id="ck-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu teléfono"
              inputMode="tel"
              maxLength={30}
              className="mt-1.5 min-h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none placeholder:text-black/40"
              style={{ borderColor: border }}
            />

            <p className="mt-5 text-sm font-semibold">Entrega</p>
            <div className="mt-1.5 flex gap-2">
              {(["retiro", "delivery"] as Fulfillment[]).map((f) => (
                <button key={f} type="button" onClick={() => setFulfillment(f)} className={pill(fulfillment === f)}
                  style={fulfillment === f ? { background: primary, borderColor: primary } : { borderColor: border }}>
                  {f === "retiro" ? "Retiro en el local" : "Delivery"}
                </button>
              ))}
            </div>

            {fulfillment === "delivery" && (
              <>
                <label htmlFor="ck-address" className="mt-4 block text-sm font-semibold">Dirección *</label>
                <input
                  id="ck-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, número, piso…"
                  maxLength={160}
                  className="mt-1.5 min-h-11 w-full rounded-lg border bg-transparent px-3 text-sm outline-none placeholder:text-black/40"
                  style={{ borderColor: border }}
                />
              </>
            )}

            <p className="mt-5 text-sm font-semibold">Pago</p>
            <div className="mt-1.5 flex gap-2">
              {(["efectivo", "mp"] as PayMethod[]).map((m) => (
                <button key={m} type="button" onClick={() => setPay(m)} className={pill(pay === m)}
                  style={pay === m ? { background: primary, borderColor: primary } : { borderColor: border }}>
                  {m === "efectivo" ? "Efectivo" : "Mercado Pago"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={confirm}
              disabled={sending}
              className="mt-6 w-full cursor-pointer rounded-lg px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              style={{ background: primary }}
            >
              {sending ? "Enviando…" : "Confirmar pedido"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, MapPin, Store } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import { updateBusinessProfileAction, saveRestaurantHoursAction } from "@/lib/actions/restaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DAY_KEYS,
  DAY_LABELS,
  defaultSchedule,
  formatScheduleToText,
  parseSchedule,
  scheduleSummary,
  type DayKey,
  type WeekSchedule,
} from "@/lib/restaurant-theme";
import { ScheduleDialog } from "./schedule-dialog";

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

function toMinutes(t: string): number | null {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function nowInTimeZone(timeZone: string): { key: DayKey; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value;
    const key = WEEKDAY_TO_KEY[get("weekday") ?? ""];
    const minutes = Number(get("hour")) * 60 + Number(get("minute"));
    if (!key || Number.isNaN(minutes)) return null;
    return { key, minutes };
  } catch {
    return null;
  }
}

function isOpenNow(schedule: WeekSchedule): boolean {
  const now = nowInTimeZone(schedule.timezone);
  if (!now) return false;
  const prev = DAY_KEYS[(DAY_KEYS.indexOf(now.key) + 6) % 7];
  const check = (key: DayKey, spillOnly: boolean) => {
    const d = schedule.days[key];
    if (!d?.enabled) return false;
    return d.slots.some((slot) => {
      const open = toMinutes(slot.open);
      const close = toMinutes(slot.close);
      if (open === null || close === null) return false;
      // Rango que cruza medianoche: vale esta noche o la madrugada siguiente.
      if (close <= open) return spillOnly ? now.minutes < close : now.minutes >= open;
      return !spillOnly && now.minutes >= open && now.minutes < close;
    });
  };
  return check(now.key, false) || check(prev, true);
}

type Props = {
  initial: { commercialName: string; phone?: string | null; email?: string | null; address?: string | null; city?: string | null; country?: string | null };
  extra: { hours?: string; whatsapp?: string; instagram?: string; facebook?: string; tiktok?: string; x?: string; schedule?: WeekSchedule };
  canEdit: boolean;
};

export function BusinessForm({ initial, extra, canEdit }: Props) {
  const [saving, setSaving] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [form, setForm] = useState({
    commercialName: initial.commercialName ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    address: initial.address ?? "",
    city: initial.city ?? "",
    country: initial.country ?? "",
    whatsapp: extra.whatsapp ?? "",
    instagram: extra.instagram ?? "",
    facebook: extra.facebook ?? "",
    tiktok: extra.tiktok ?? "",
    x: extra.x ?? "",
  });
  const [schedule, setSchedule] = useState<WeekSchedule>(() => parseSchedule(extra.schedule) ?? defaultSchedule());

  const scheduleText = useMemo(() => scheduleSummary(schedule), [schedule]);
  const openDays = useMemo(() => Object.values(schedule.days).filter((d) => d.enabled).length, [schedule]);
  // Solo cliente: evita mismatch de hidratación (server y primer render no calculan hora local).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const openNow = useMemo(() => (mounted ? isOpenNow(schedule) : null), [mounted, schedule]);
  const todayKey = useMemo(
    () => (mounted ? (nowInTimeZone(schedule.timezone)?.key ?? null) : null),
    [mounted, schedule.timezone],
  );

  const completion = useMemo(() => {
    const fields = [form.commercialName, form.phone, form.address, form.city, form.whatsapp, scheduleText];
    return Math.round((fields.filter((f) => f.trim().length > 0).length / fields.length) * 100);
  }, [form, scheduleText]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSave() {
    if (!canEdit) return toast.error("Solo el administrador puede editar.");
    if (form.commercialName.trim().length < 2) return toast.error("El nombre necesita 2 letras mínimo.");
    setSaving(true);
    try {
      const r1 = await updateBusinessProfileAction({
        commercialName: form.commercialName.trim(),
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        country: form.country,
      });
      if (!r1.ok) throw new Error(r1.error);
      const r2 = await saveRestaurantHoursAction({
        hours: formatScheduleToText(schedule),
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        facebook: form.facebook,
        tiktok: form.tiktok,
        x: form.x,
        schedule,
      });
      if (!r2.ok) throw new Error(r2.error);
      toast.success("Ficha guardada. Ya se ve en tu menú.");
    } catch (e) {
      console.error("[negocio]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar. Revisá los datos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A2540] text-white"><Store className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{form.commercialName || "Tu restaurante"}</p>
          <p className="text-xs text-muted-foreground">Ficha completa al {completion}% · se muestra en carta y buscadores</p>
        </div>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-[#6D28D9] transition-all" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="negocio-basico" className="rounded-2xl border border-border bg-card p-6">
          <h2 id="negocio-basico" className="mt-1 text-base font-semibold tracking-tight">Información básica</h2>
          <p className="mb-5 mt-1 text-[13px] leading-relaxed text-muted-foreground">Nombre, contacto y dónde te encuentran.</p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comercial">Nombre comercial *</Label>
              <Input id="comercial" value={form.commercialName} onChange={set("commercialName")} disabled={!canEdit} maxLength={120} placeholder="Ej: La Brasa de Tomy" className="mt-1.5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="tel">Teléfono</Label><Input id="tel" value={form.phone} onChange={set("phone")} disabled={!canEdit} placeholder="+57 300 123 4567" inputMode="tel" className="mt-1.5" /></div>
              <div><Label htmlFor="mail">Email</Label><Input id="mail" value={form.email} onChange={set("email")} disabled={!canEdit} placeholder="hola@turesto.com" inputMode="email" className="mt-1.5" /></div>
            </div>
            <div>
              <Label htmlFor="dir"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />Dirección</span></Label>
              <Input id="dir" value={form.address} onChange={set("address")} disabled={!canEdit} placeholder="Calle 10 #5-20" className="mt-1.5" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="ciudad">Ciudad</Label><Input id="ciudad" value={form.city} onChange={set("city")} disabled={!canEdit} placeholder="Medellín" className="mt-1.5" /></div>
              <div><Label htmlFor="pais">País</Label><Input id="pais" value={form.country} onChange={set("country")} disabled={!canEdit} placeholder="Colombia" className="mt-1.5" /></div>
            </div>
          </div>
        </section>

        <section aria-labelledby="negocio-redes" className="rounded-2xl border border-border bg-card p-6">
          <h2 id="negocio-redes" className="mt-1 text-base font-semibold tracking-tight">Redes sociales</h2>
          <p className="mb-5 mt-1 text-[13px] leading-relaxed text-muted-foreground">Por dónde te escriben y te siguen.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FaInstagram className="h-5 w-5 shrink-0 text-rose-500" aria-hidden />
              <Input value={form.instagram} onChange={set("instagram")} disabled={!canEdit} placeholder="https://instagram.com/tu-cuenta" inputMode="url" aria-label="Link de Instagram" maxLength={200} />
            </div>
            <div className="flex items-center gap-3">
              <FaFacebook className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
              <Input value={form.facebook} onChange={set("facebook")} disabled={!canEdit} placeholder="https://facebook.com/tu-pagina" inputMode="url" aria-label="Link de Facebook" maxLength={200} />
            </div>
            <div className="flex items-center gap-3">
              <FaWhatsapp className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
              <Input value={form.whatsapp} onChange={set("whatsapp")} disabled={!canEdit} placeholder="+57 300 123 4567" inputMode="tel" aria-label="WhatsApp" maxLength={40} />
            </div>
            <div className="flex items-center gap-3">
              <FaTiktok className="h-5 w-5 shrink-0" aria-hidden />
              <Input value={form.tiktok} onChange={set("tiktok")} disabled={!canEdit} placeholder="https://tiktok.com/@tu-cuenta" inputMode="url" aria-label="Link de TikTok" maxLength={200} />
            </div>
            <div className="flex items-center gap-3">
              <FaXTwitter className="h-5 w-5 shrink-0" aria-hidden />
              <Input value={form.x} onChange={set("x")} disabled={!canEdit} placeholder="https://x.com/tu-cuenta" inputMode="url" aria-label="Link de X" maxLength={200} />
            </div>
          </div>
        </section>
      </div>

      <section aria-labelledby="negocio-horario" className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="negocio-horario" className="mt-1 flex-1 text-base font-semibold tracking-tight">Horarios de atención</h2>
          {openDays === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden />
              Cerrado temporalmente
            </span>
          ) : openNow === true ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Abierto ahora
            </span>
          ) : openNow === false ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden />
              Cerrado ahora
            </span>
          ) : null}
        </div>
        <p className="mb-4 mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {openDays} de 7 días abiertos · {schedule.timezone}
        </p>
        <ul className="mb-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
          {DAY_KEYS.map((key) => {
            const d = schedule.days[key];
            const hours = d?.enabled && d.slots.length > 0
              ? d.slots.map((s) => `${s.open}–${s.close}`).join(" y ")
              : null;
            const isToday = key === todayKey;
            return (
              <li
                key={key}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${isToday ? "bg-primary/5 font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                <span className="inline-flex items-center gap-2">
                  {DAY_LABELS[key]}
                  {isToday ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                      Hoy
                    </span>
                  ) : null}
                </span>
                {hours ? (
                  <span className="tabular-nums">{hours}</span>
                ) : (
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Cerrado</span>
                )}
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          onClick={() => setScheduleOpen(true)}
          disabled={!canEdit}
          className="min-h-10 bg-primary font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Clock className="h-4 w-4" /> Configurar mis horarios
        </Button>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
          <Button onClick={onSave} disabled={saving || !canEdit} className="min-h-10 flex-1 bg-[#0A2540] hover:bg-[#0A2540]/90 focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2 sm:flex-none sm:px-8">
            {saving ? "Guardando..." : "Guardar ficha"}
          </Button>
          {canEdit
            ? <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" />Se publica al instante en tu carta</p>
            : <p className="text-xs text-muted-foreground">Tu rol es miembro: pedí acceso de administrador para editar.</p>}
        </div>
      </section>

      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        value={schedule}
        disabled={!canEdit}
        onSave={setSchedule}
      />
    </div>
  );
}

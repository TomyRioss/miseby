"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DAY_KEYS,
  DAY_LABELS,
  TIMEZONE_OPTIONS,
  defaultSchedule,
  parseSchedule,
  timeOptions,
  type DayKey,
  type WeekSchedule,
} from "@/lib/restaurant-theme";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value?: WeekSchedule;
  disabled?: boolean;
  onSave: (v: WeekSchedule) => void;
};

const TIMES = timeOptions(30);

function TimeSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-24 rounded-lg border border-input bg-background px-2 text-sm tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {TIMES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

export function ScheduleDialog({ open, onOpenChange, value, disabled, onSave }: Props) {
  const [draft, setDraft] = useState<WeekSchedule>(() => parseSchedule(value) ?? defaultSchedule());

  useEffect(() => {
    if (open) setDraft(parseSchedule(value) ?? defaultSchedule());
  }, [open, value]);

  const openCount = useMemo(() => DAY_KEYS.filter((k) => draft.days[k]?.enabled).length, [draft]);

  function toggleDay(day: DayKey, enabled: boolean) {
    setDraft((d) => ({ ...d, days: { ...d.days, [day]: { ...d.days[day], enabled } } }));
  }

  function setSlot(day: DayKey, idx: number, patch: Partial<{ open: string; close: string }>) {
    setDraft((d) => {
      const slots = d.days[day].slots.map((s, i) => (i === idx ? { ...s, ...patch } : s));
      return { ...d, days: { ...d.days, [day]: { ...d.days[day], slots } } };
    });
  }

  function addSlot(day: DayKey) {
    setDraft((d) => {
      const cur = d.days[day].slots;
      if (cur.length >= 3) {
        toast.error("Máximo 3 turnos por día.");
        return d;
      }
      const last = cur[cur.length - 1] ?? { open: "09:00", close: "18:00" };
      return { ...d, days: { ...d.days, [day]: { ...d.days[day], enabled: true, slots: [...cur, { ...last }] } } };
    });
  }

  function removeSlot(day: DayKey, idx: number) {
    setDraft((d) => {
      const slots = d.days[day].slots.filter((_, i) => i !== idx);
      if (slots.length === 0) return d;
      return { ...d, days: { ...d.days, [day]: { ...d.days[day], slots } } };
    });
  }

  function handleSave() {
    try {
      for (const k of DAY_KEYS) {
        const d = draft.days[k];
        if (!d?.enabled) continue;
        for (const s of d.slots) {
          if (s.open >= s.close) {
            toast.error(`Revisá ${DAY_LABELS[k]}: la apertura debe ser antes del cierre.`);
            return;
          }
        }
      }
      onSave(draft);
      onOpenChange(false);
    } catch (e) {
      console.error("[horarios]", e);
      toast.error("No se pudo guardar. Probá de nuevo.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="flex items-center justify-between bg-orange-500 px-5 py-3.5 text-white">
          <DialogTitle className="text-[15px] font-semibold text-white">Configurar mis horarios</DialogTitle>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[62vh] space-y-5 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-600">
            <Clock className="h-4 w-4" /> Horario de atención
          </div>

          <div>
            <Label htmlFor="tz" className="text-xs text-muted-foreground">
              Zona horaria
            </Label>
            <select
              id="tz"
              value={draft.timezone}
              disabled={disabled}
              onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-5">
            {DAY_KEYS.map((day) => {
              const d = draft.days[day];
              const enabled = d?.enabled === true;
              return (
                <div key={day}>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex min-w-28 items-center gap-2">
                      <Switch checked={enabled} onCheckedChange={(v) => toggleDay(day, v)} disabled={disabled} aria-label={DAY_LABELS[day]} />
                      <span className={`text-sm font-medium ${enabled ? "" : "text-muted-foreground"}`}>
                        {enabled ? "Abierto" : "Cerrado"}
                      </span>
                    </div>
                    <span className={`w-16 text-sm ${enabled ? "" : "text-muted-foreground"}`}>{DAY_LABELS[day]}</span>
                    {enabled && d.slots.length === 1 && (
                      <div className="flex items-center gap-2">
                        <TimeSelect value={d.slots[0].open} onChange={(v) => setSlot(day, 0, { open: v })} disabled={disabled} label={`Apertura ${DAY_LABELS[day]}`} />
                        <span className="text-muted-foreground">-</span>
                        <TimeSelect value={d.slots[0].close} onChange={(v) => setSlot(day, 0, { close: v })} disabled={disabled} label={`Cierre ${DAY_LABELS[day]}`} />
                      </div>
                    )}
                  </div>

                  {enabled && d.slots.length > 1 && (
                    <div className="ml-0 mt-2 space-y-2 sm:ml-48">
                      {d.slots.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <TimeSelect value={s.open} onChange={(v) => setSlot(day, i, { open: v })} disabled={disabled} label={`Apertura ${i + 1} ${DAY_LABELS[day]}`} />
                          <span className="text-muted-foreground">-</span>
                          <TimeSelect value={s.close} onChange={(v) => setSlot(day, i, { close: v })} disabled={disabled} label={`Cierre ${i + 1} ${DAY_LABELS[day]}`} />
                          <button
                            type="button"
                            aria-label={`Quitar turno ${i + 1}`}
                            onClick={() => removeSlot(day, i)}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {enabled && (
                    <div className="ml-0 mt-1.5 sm:ml-48">
                      <button
                        type="button"
                        onClick={() => addSlot(day)}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar otro horario
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">{openCount} de 7 días abiertos</p>
        </div>

        <div className="border-t bg-background p-3">
          <Button onClick={handleSave} disabled={disabled} className="min-h-11 w-full bg-orange-500 text-sm font-semibold hover:bg-orange-600">
            Guardar y cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MISELINK_SOCIAL_NETWORKS } from "@/lib/miselink/social-networks";
import { SOCIAL_NETWORKS, type SocialNetwork } from "@/lib/validations/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";

type State = ReturnType<typeof useMiseLinkState>;

export function SocialsTabSection({ state }: { state: State }) {
  const [network, setNetwork] = useState<SocialNetwork>("instagram");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const submit = async () => {
    if (!url.trim()) return;
    setAdding(true);
    const ok = await state.addSocial({ network, url: url.trim() });
    setAdding(false);
    if (ok) setUrl("");
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Redes sociales</h3>

      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border p-3 sm:flex-row">
        <Select value={network} onValueChange={(v) => setNetwork(v as SocialNetwork)}>
          <SelectTrigger className="w-full rounded-lg sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOCIAL_NETWORKS.map((n) => (
              <SelectItem key={n} value={n}>
                {MISELINK_SOCIAL_NETWORKS[n].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          inputMode="url"
          className="rounded-lg"
        />
        <Button onClick={submit} disabled={adding || !url.trim()} className="shrink-0 gap-1 rounded-lg">
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      </div>

      {state.socials.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {state.socials.map((s) => {
            const meta = MISELINK_SOCIAL_NETWORKS[s.network as SocialNetwork];
            const Icon = meta?.icon;
            return (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm"
              >
                {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
                <span className="w-24 shrink-0 text-muted-foreground">{meta?.label ?? s.network}</span>
                <span className="flex-1 truncate text-xs">{s.url}</span>
                <button
                  type="button"
                  aria-label="Eliminar red social"
                  onClick={() => state.removeSocial(s.id)}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

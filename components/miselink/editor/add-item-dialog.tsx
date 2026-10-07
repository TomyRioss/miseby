"use client";

import { useMemo, useState } from "react";
import {
  FaPlus,
  FaLightbulb,
  FaHeart,
  FaEllipsis,
  FaLink,
  FaBookOpen,
  FaUtensils,
  FaChevronRight,
  FaCircleCheck,
  FaCircleExclamation,
  FaMagnifyingGlass,
} from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MiseLinkItemKind, SocialNetwork } from "@/lib/validations/miselink";
import {
  MISELINK_SOCIAL_NETWORKS,
  normalizeSocialUrl,
} from "@/lib/miselink/social-networks";

type AddInput = { title: string; url?: string; type?: MiseLinkItemKind };

const CATEGORIES = [
  { icon: FaLightbulb, label: "Sugeridos", key: "sugeridos" },
  { icon: FaHeart, label: "Social", key: "social" },
  { icon: FaEllipsis, label: "Ver todo", key: "todo" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const ALL_SOCIALS = Object.keys(MISELINK_SOCIAL_NETWORKS) as SocialNetwork[];

type Mode = "menu" | "link" | `social:${SocialNetwork}`;

function isValidUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function AddItemDialog({
  onAdd,
  planCode,
  orgSlug,
}: {
  onAdd: (input: AddInput) => Promise<boolean>;
  planCode?: string;
  orgSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [category, setCategory] = useState<CategoryKey>("sugeridos");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [socialValue, setSocialValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeSocial: SocialNetwork | null =
    mode.startsWith("social:") ? (mode.split(":")[1] as SocialNetwork) : null;
  const socialMeta = activeSocial ? MISELINK_SOCIAL_NETWORKS[activeSocial] : null;
  const normalizedSocial = activeSocial ? normalizeSocialUrl(activeSocial, socialValue) : "";
  const socialValid = socialValue.trim() ? isValidUrl(normalizedSocial) : false;

  const reset = () => {
    setMode("menu");
    setTitle("");
    setUrl("");
    setSocialValue("");
    setError("");
  };

  const close = (v: boolean) => {
    setOpen(v);
    if (!v) {
      reset();
      setSearch("");
      setCategory("sugeridos");
    }
  };

  const catalogSuggestion = useMemo(() => {
    if (!orgSlug) return null;
    if (planCode === "mise")
      return { title: "Catalogo", url: `/catalogo/${orgSlug}`, Icon: FaBookOpen };
    if (planCode === "mise_restaurant")
      return { title: "Menu", url: `/menu/${orgSlug}`, Icon: FaUtensils };
    return null;
  }, [planCode, orgSlug]);

  const addCatalog = async () => {
    if (!catalogSuggestion || busy) return;
    setBusy(true);
    setError("");
    const ok = await onAdd({
      title: catalogSuggestion.title,
      url: catalogSuggestion.url,
      type: "link",
    });
    setBusy(false);
    if (ok) close(false);
    else setError("No se pudo agregar. Revisá los datos.");
  };

  const filteredSocials = useMemo(() => {
    const base = ALL_SOCIALS;
    const q = search.trim().toLowerCase();
    return base.filter((n) => {
      const m = MISELINK_SOCIAL_NETWORKS[n];
      return !q || m.label.toLowerCase().includes(q) || n.includes(q);
    });
  }, [search, category]);

  const submitLink = async () => {
    if (!title.trim()) return;
    if (!url.trim()) return;
    setBusy(true);
    setError("");
    const ok = await onAdd({ title: title.trim(), url: url.trim(), type: "link" });
    setBusy(false);
    if (ok) close(false);
    else setError("No se pudo agregar. Revisá los datos.");
  };

  const submitSocial = async () => {
    if (!activeSocial || !socialMeta) return;
    if (!socialValid) {
      setError("Pegá un link válido o un @usuario.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const ok = await onAdd({ title: socialMeta.label, url: normalizedSocial, type: "link" });
      if (ok) close(false);
      else setError("No se pudo agregar esta red. Probá de nuevo.");
    } catch (e) {
      console.error("[add-item-dialog] social como card", e);
      setError("No se pudo agregar esta red. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const quickAddUrl = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    setUrl(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    setTitle(v);
    setMode("link");
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full gap-2.5 rounded-xl border border-[#0A2540] bg-[#0A2540] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_5px_rgba(10,37,64,0.12)] transition-colors hover:border-[#0A2540] hover:bg-[#0A2540] focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2 sm:w-auto"
        >
          <FaPlus className="h-3.5 w-3.5" /> Agregar destino
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[min(640px,88dvh)] max-h-[88dvh] flex-col gap-0 overflow-hidden rounded-2xl border-[#E2E8F0] bg-[#FFFFFF] p-5 text-[#0A2540] shadow-[0_16px_48px_rgba(10,37,64,0.16)] sm:p-6 sm:max-w-3xl">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle className="font-display text-lg font-semibold text-[#0A2540]">Agregar destino</DialogTitle>
        </DialogHeader>

        {mode === "menu" ? (
          <div className="flex min-h-0 flex-1 flex-col space-y-4">
            <div className="relative shrink-0">
              <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pegá o buscá un link"
                className="h-11 rounded-xl border border-[#E2E8F0] bg-white pl-10 text-sm text-[#0A2540] shadow-none placeholder:text-[#475569] focus-visible:ring-2 focus-visible:ring-[#0A2540]/35"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    quickAddUrl(e.currentTarget.value);
                  }
                }}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "cursor-pointer shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                    category === c.key
                      ? "bg-[#0A2540] text-white"
                      : "bg-[#F1F5F9] text-[#475569]",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex min-h-0 flex-1 gap-8">
              <aside className="hidden w-44 shrink-0 flex-col gap-0.5 sm:flex">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      "cursor-pointer flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors",
                      category === c.key
                        ? "bg-[#F1F5F9] font-semibold text-[#0A2540]"
                        : "text-[#475569] hover:bg-[#FFFFFF] hover:text-[#0A2540]",
                    )}
                  >
                    <c.icon
                      className={cn("h-4 w-4", category === c.key && "text-[#0A2540]")}
                    />{" "}
                    {c.label}
                  </button>
                ))}
              </aside>

              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-2 [scrollbar-width:thin]">
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("link")}
                    className="cursor-pointer group flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#0A2540] hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A2540] text-white">
                      <FaLink className="h-4 w-4 text-white" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">Link</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        Agregá una URL personalizada
                      </span>
                    </span>
                    <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-[#475569] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0A2540]" />
                  </button>
                  {catalogSuggestion && (
                    <button
                      type="button"
                      onClick={addCatalog}
                      disabled={busy}
                      className="cursor-pointer group flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#0A2540] hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] disabled:opacity-60"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A2540] text-white">
                        <catalogSuggestion.Icon className="h-4 w-4 text-white" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {catalogSuggestion.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {catalogSuggestion.url}
                        </span>
                      </span>
                      <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-[#475569] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0A2540]" />
                    </button>
                  )}
                </div>

                <p className="mb-1 mt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sugeridos
                </p>
                {filteredSocials.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#E2E8F0] bg-white p-4 text-center text-sm text-[#475569]">
                    Sin resultados. Probá con “link” o pegá una URL arriba.
                  </p>
                ) : (
                  <ul>
                    {filteredSocials.map((n) => {
                      const s = MISELINK_SOCIAL_NETWORKS[n];
                      const Icon = s.icon;
                      return (
                        <li key={n}>
                          <button
                            type="button"
                            onClick={() => {
                              setSocialValue("");
                              setError("");
                              setMode(`social:${n}`);
                            }}
                            className="group flex w-full items-center gap-4 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540]"
                          >
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5"
                              style={{ background: s.bg }}
                            >
                              <Icon className="h-[18px] w-[18px] text-white" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium leading-tight text-foreground">
                                {s.label}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {s.desc}
                              </span>
                            </span>
                            <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : mode === "link" ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={reset}
              className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
            >
              ← Volver
            </button>
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del enlace"
                className="rounded-xl"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                inputMode="url"
                className="rounded-xl"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button
              onClick={submitLink}
              disabled={busy || !title.trim() || !url.trim()}
              className="w-full rounded-xl bg-[#0A2540] text-white hover:bg-[#0A2540] focus-visible:ring-[#0A2540]"
            >
              {busy ? "Agregando…" : "Agregar"}
            </Button>
          </div>
        ) : (
          socialMeta &&
          activeSocial && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
              >
                ← Volver
              </button>

              <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: socialMeta.bg }}
                >
                  <socialMeta.icon className="h-6 w-6 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{socialMeta.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{socialMeta.desc}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {activeSocial === "maps"
                    ? "Dirección o link de Maps"
                    : activeSocial === "website"
                      ? "URL personalizada"
                      : `Usuario o link de ${socialMeta.label}`}
                </label>
                <Input
                  value={socialValue}
                  onChange={(e) => {
                    setSocialValue(e.target.value);
                    setError("");
                  }}
                  placeholder={socialMeta.placeholder}
                  inputMode="url"
                  className="rounded-xl"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && socialValid) submitSocial();
                  }}
                />
                <p className="text-xs text-muted-foreground">{socialMeta.hint}</p>
              </div>

              {socialValue.trim() && (
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-xl border p-3 text-xs",
                    socialValid
                      ? "border-slate-200 bg-slate-50 text-[#0A2540/90]"
                      : "border-amber-200 bg-amber-50 text-amber-800",
                  )}
                >
                  {socialValid ? (
                    <FaCircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <FaCircleExclamation className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span className="min-w-0">
                    {socialValid ? (
                      <>
                        Se agregará:{" "}
                        <span className="break-all font-medium">{normalizedSocial}</span>
                      </>
                    ) : (
                      "Todavía no es un link válido. Pegá la URL completa o probá con @usuario."
                    )}
                  </span>
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <Button
                onClick={submitSocial}
                disabled={busy || !socialValid}
                className="w-full rounded-xl bg-[#0A2540] text-white hover:bg-[#0A2540] focus-visible:ring-[#0A2540]"
              >
                {busy ? "Agregando…" : `Agregar ${socialMeta.label}`}
              </Button>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}

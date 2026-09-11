"use client";

import { useState } from "react";

import { FaUser, FaPencil } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MISELINK_SOCIAL_NETWORKS } from "@/lib/miselink/social-networks";
import type { SocialNetwork } from "@/lib/validations/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";
import { uploadAvatarAction } from "@/lib/actions/avatar";
import { EditorHeaderActions } from "./editor-toolbar";
import { ProfileTab } from "./profile-tab";
import { SocialsTabSection } from "./socials-tab-section";

type State = ReturnType<typeof useMiseLinkState>;

export function MainMenuHeader({ state }: { state: State }) {
  const { page } = state;

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <ProfileEditPopover state={state}>
            <button
              type="button"
              className="group -ml-1 flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/60"
            >
              <span className="text-lg font-bold text-foreground group-hover:underline group-hover:underline-offset-4">@{page.username}</span>
              <FaPencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </ProfileEditPopover>

          <ProfileEditPopover state={state}>
            <button
              type="button"
              className="mt-0.5 -ml-1 block cursor-pointer rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground hover:underline hover:underline-offset-4"
            >
              {page.bio || "Agregar bio"}
            </button>
          </ProfileEditPopover>

          <div className="mt-2 flex items-center gap-2">
            {state.socials.map((s) => {
              const Icon = MISELINK_SOCIAL_NETWORKS[s.network as SocialNetwork]?.icon;
              return Icon ? (
                <span
                  key={s.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ) : null;
            })}
            <SocialsEditPopover state={state} />
          </div>

        </div>

        <AvatarEditDialog state={state}>
          <button type="button" aria-label="Editar foto de perfil" className="group relative cursor-pointer">
            <Avatar className="size-16 shrink-0 transition group-hover:brightness-95 group-hover:ring-2 group-hover:ring-foreground/30 sm:size-20">
              {page.avatarUrl ? <AvatarImage src={page.avatarUrl} alt="" /> : null}
              <AvatarFallback>
                <FaUser className="h-7 w-7 sm:h-8 sm:w-8" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute right-0 bottom-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
              <FaPencil className="h-3 w-3" />
            </span>
          </button>
        </AvatarEditDialog>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <EditorHeaderActions state={state} />
      </div>
    </header>
  );
}

function ProfileEditPopover({
  state,
  children,
}: {
  state: State;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Title and bio</DialogTitle>
        </DialogHeader>
        <ProfileTab state={state} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AvatarEditDialog({
  state,
  children,
}: {
  state: State;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const preview = localPreview || state.page.avatarUrl || "";

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) {
      setError("");
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Solo JPG, PNG o WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Máximo 2 MB.");
      return;
    }
    setError("");
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadAvatarAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const ok = await state.saveProfile({ avatarUrl: res.url });
      if (ok) setOpen(false);
      else setError("Subida ok, pero no se pudo guardar. Probá de nuevo.");
    } catch (e) {
      console.error("[avatar-edit] upload", e);
      setError("No se pudo subir la foto. Probá de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Foto de perfil</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <Avatar className="size-24">
            {preview ? <AvatarImage src={preview} alt="" /> : null}
            <AvatarFallback>
              <FaUser className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <label
            className={`w-full cursor-pointer rounded-full border border-dashed border-border px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-muted ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            {uploading ? "Subiendo…" : "Subir desde el dispositivo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading || saving}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {state.page.avatarUrl ? (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full"
              disabled={saving || uploading}
              onClick={async () => {
                setError("");
                setSaving(true);
                try {
                  const ok = await state.saveProfile({ avatarUrl: "" });
                  if (ok) setOpen(false);
                  else setError("No se pudo quitar la foto.");
                } catch (e) {
                  console.error("[avatar-edit] quitar", e);
                  setError("No se pudo quitar la foto.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Quitar foto
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SocialsEditPopover({ state }: { state: State }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Editar redes sociales"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
        >
          <FaPencil className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <SocialsTabSection state={state} />
      </PopoverContent>
    </Popover>
  );
}

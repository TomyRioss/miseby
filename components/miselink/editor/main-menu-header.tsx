"use client";

import { useState } from "react";

import { FaUser, FaPencil } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";
import { ProfileTab } from "./profile-tab";
import { EditorHeaderActions } from "./editor-toolbar";
import { AvatarEditDialog } from "./avatar-edit-dialog";
import { SocialsEditPopover } from "./socials-edit-popover";
import { MISELINK_SOCIAL_NETWORKS } from "@/lib/miselink/social-networks";
import type { SocialNetwork } from "@/lib/validations/miselink";

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
              className="group -ml-1 flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-left transition-all duration-200 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="text-lg font-bold text-foreground group-hover:underline group-hover:underline-offset-4">@{page.username}</span>
              <FaPencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </button>
          </ProfileEditPopover>

          <ProfileEditPopover state={state}>
            <button
              type="button"
              className="mt-0.5 -ml-1 block cursor-pointer rounded-md px-1 py-1 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted/60 hover:text-foreground hover:underline hover:underline-offset-4"
            >
              {page.bio || "Agregar biografía"}
            </button>
          </ProfileEditPopover>

          <div className="mt-2 flex items-center gap-2">
            {state.socials.map((s) => {
              const Icon = MISELINK_SOCIAL_NETWORKS[s.network as SocialNetwork]?.icon;
              return Icon ? (
                <span
                  key={s.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-all duration-200 hover:bg-muted/80 hover:shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ) : null;
            })}
            <SocialsEditPopover state={state} />
          </div>

        </div>

        <AvatarEditDialog state={state}>
          <button type="button" aria-label="Editar foto de perfil" className="group relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full">
            <Avatar className="size-16 shrink-0 transition-all duration-200 group-hover:brightness-95 group-hover:ring-2 group-hover:ring-foreground/30 sm:size-20">
              {page.avatarUrl ? <AvatarImage src={page.avatarUrl} alt="" /> : null}
              <AvatarFallback>
                <FaUser className="h-7 w-7 sm:h-8 sm:w-8" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute right-0 bottom-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 group-hover:shadow-md">
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
          <DialogTitle className="text-center">Título y biografía</DialogTitle>
        </DialogHeader>
        <ProfileTab state={state} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

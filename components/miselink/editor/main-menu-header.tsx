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
    <header className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-[#0A2540] sm:text-[2.15rem]">
            Tu MiseLink
          </h1>
          <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-[#475569]">
            <span className="size-2 shrink-0 rounded-none bg-[#0A2540]" aria-hidden="true" />
            <span className="truncate font-mono text-xs sm:text-[13px]">
              miseby.com/{page.username}
            </span>
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              page.published
                ? "border-slate-200 bg-slate-50 text-[#0A2540/90]"
                : "border-[#CBD5E1] bg-white/80 text-[#475569]"
            }`}
          >
            <span
              className={`size-1.5 rounded-none ${page.published ? "bg-[#0A2540]" : "bg-slate-400"}`}
              aria-hidden="true"
            />
            {page.published ? "Publicada" : "Borrador"}
          </span>
          <EditorHeaderActions state={state} />
        </div>
      </div>

      <section
        className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white/75 px-4 py-4 sm:px-5"
        aria-label="Perfil de la página"
      >
        <AvatarEditDialog state={state}>
          <button
            type="button"
            aria-label="Editar foto de perfil"
            className="group relative shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2"
          >
            <Avatar className="size-[68px] shrink-0 ring-1 ring-[#E2E8F0] transition group-hover:ring-2 group-hover:ring-[#0A2540] motion-reduce:transition-none sm:size-[76px]">
              {page.avatarUrl ? <AvatarImage src={page.avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-[#E2E8F0] text-[#0A2540]">
                <FaUser className="h-7 w-7" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#0A2540] text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <FaPencil className="h-2.5 w-2.5" />
            </span>
          </button>
        </AvatarEditDialog>

        <div className="min-w-0 flex-1">
          <ProfileEditPopover state={state}>
            <button
              type="button"
              aria-label="Editar nombre y biografía"
              className="group flex max-w-full cursor-pointer items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2"
            >
              <span className="truncate font-display text-lg font-semibold text-[#0A2540] sm:text-xl">
                {page.displayName || `@${page.username}`}
              </span>
              <FaPencil className="h-3 w-3 shrink-0 text-[#0A2540] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
            </button>
          </ProfileEditPopover>

          <ProfileEditPopover state={state}>
            <button
              type="button"
              className="mt-0.5 line-clamp-2 block max-w-full cursor-pointer whitespace-normal rounded-md text-left text-sm text-[#475569] hover:text-[#0A2540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2"
            >
              {page.bio || "Agregar biografía"}
            </button>
          </ProfileEditPopover>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ProfileEditPopover state={state}>
              <button
                type="button"
                className="cursor-pointer rounded-full border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-1 font-mono text-[10px] text-[#475569] hover:border-[#0A2540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540]"
              >
                @{page.username}
              </button>
            </ProfileEditPopover>
            {state.socials.map((social) => {
              const network = MISELINK_SOCIAL_NETWORKS[social.network as SocialNetwork];
              const Icon = network?.icon;
              return Icon ? (
                <span
                  key={social.id}
                  role="img"
                  aria-label={network.label}
                  className="flex size-7 items-center justify-center rounded-full bg-[#F1F5F9] text-[#0A2540]"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              ) : null;
            })}
            <SocialsEditPopover state={state} />
          </div>
        </div>
      </section>
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
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[#0A2540]">
            Título y biografía
          </DialogTitle>
        </DialogHeader>
        <ProfileTab state={state} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

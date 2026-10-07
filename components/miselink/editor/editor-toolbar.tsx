"use client";

import { useState } from "react";
import { FiSettings } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MiseLinkPublicView } from "@/components/miselink/render/miselink-public-view";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";
import { SettingsTab } from "./settings-tab";

type State = ReturnType<typeof useMiseLinkState>;

export function EditorHeaderActions({ state }: { state: State }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="cursor-pointer flex min-h-10 items-center rounded-xl border border-[#CBD5E1] bg-white/70 px-4 py-2 text-sm font-medium text-[#0A2540] transition-colors hover:border-[#0A2540] hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540]"
        >
          Vista previa
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Ajustes"
          className="cursor-pointer flex size-10 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white/70 text-[#0A2540] transition-colors hover:border-[#0A2540] hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540]"
        >
          <FiSettings className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-sm border-[#E2E8F0] bg-[#FFFFFF] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Vista previa</DialogTitle>
            <DialogDescription>Vista previa de tu página pública</DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto rounded-lg bg-[#FFFFFF]">
            <MiseLinkPublicView
              page={{
                username: state.page.username,
                displayName: state.page.displayName,
                bio: state.page.bio,
                avatarUrl: state.page.avatarUrl,
              }}
              items={state.items
                .filter((i) => i.active && i.type !== "collection")
                .map((i) => ({ id: i.id, title: i.title, url: i.url }))}
                socials={state.socials.map((s) => ({ id: s.id, network: s.network, url: s.url }))}
                theme={(state.page as { theme?: unknown }).theme}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-[#E2E8F0] bg-[#FFFFFF] text-[#0A2540]">
          <DialogHeader>
            <DialogTitle className="font-display text-[#0A2540]">Ajustes</DialogTitle>
            <DialogDescription className="sr-only">
              Configurá tu nombre de usuario y contraseña
            </DialogDescription>
          </DialogHeader>
          <SettingsTab state={state} />
        </DialogContent>
      </Dialog>
    </>
  );
}

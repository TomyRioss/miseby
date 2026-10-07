"use client";

import { useState } from "react";
import type { MiseLinkItem, MiseLinkSocial } from "@prisma/client";
import { useMiseLinkState, type EditorPage } from "@/hooks/use-miselink-state";
import { MiseLinkPhonePreview } from "@/components/miselink/render/miselink-phone-preview";
import { MainMenuHeader } from "./main-menu-header";
import { MainMenuList } from "./main-menu-list";
import { AddItemDialog } from "./add-item-dialog";
import { ShareDialog } from "./share-dialog";

export function MiseLinkEditor({
  initial,
  planCode,
  orgSlug,
}: {
  initial: { page: EditorPage; items: MiseLinkItem[]; socials: MiseLinkSocial[] };
  planCode?: string;
  orgSlug?: string;
}) {
  const state = useMiseLinkState(initial);
  const [shareOpen, setShareOpen] = useState(false);
  const activeDestinations = state.items.filter(
    (item) => item.active && item.type !== "collection",
  ).length;

  return (
    <div className="mx-auto grid w-full max-w-[1480px] gap-10 bg-white bg-[linear-gradient(to_right,rgba(10,37,64,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,37,64,0.012)_1px,transparent_1px)] bg-[length:56px_56px] px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:gap-8 lg:px-8 lg:py-8 xl:px-10">
      <section className="flex min-w-0 flex-col gap-8">
        <MainMenuHeader state={state} />

        <section aria-labelledby="public-current-heading" className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="public-current-heading"
                className="font-display text-2xl font-semibold tracking-[-0.025em] text-[#0A2540]"
              >
                Corriente pública
              </h2>
              <p className="mt-1 text-sm text-[#475569]">
                Ordená los destinos que aparecen en tu página.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
              <span className="font-mono text-xs tabular-nums text-[#475569]">
                {activeDestinations} destinos activos
              </span>
              <div className="w-full sm:w-auto">
                <AddItemDialog onAdd={state.addLink} planCode={planCode} orgSlug={orgSlug} />
              </div>
            </div>
          </div>

          <MainMenuList state={state} />
        </section>
      </section>

      <aside className="hidden min-w-0 lg:block" aria-label="Vista previa de tu página">
        <div className="sticky top-6 flex h-[min(760px,calc(100dvh-112px))] min-h-[520px] flex-col rounded-[24px] border border-[#E2E8F0] bg-white p-3">
          <div className="flex items-center justify-between px-2 pb-3 pt-1">
            <h2 className="font-display text-sm font-semibold text-[#0A2540]">
              Vista en vivo
            </h2>
            <span className="flex items-center gap-1.5 text-[11px] text-[#475569]">
              <span className="size-1.5 rounded-none bg-[#0A2540]" aria-hidden="true" />
              Actualizada
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-[18px]">
            <MiseLinkPhonePreview
              username={state.page.username}
              page={{
                displayName: state.page.displayName,
                bio: state.page.bio,
                avatarUrl: state.page.avatarUrl,
              }}
              items={state.items
                .filter((item) => item.active && item.type !== "collection")
                .map((item) => ({
                  id: item.id,
                  title: item.title,
                  url: item.url,
                }))}
              socials={state.socials.map((social) => ({
                id: social.id,
                network: social.network,
                url: social.url,
              }))}
              theme={(state.page as { theme?: unknown }).theme}
              onShare={() => setShareOpen(true)}
            />
          </div>
        </div>
      </aside>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        username={state.page.username}
        displayName={state.page.displayName}
      />
    </div>
  );
}

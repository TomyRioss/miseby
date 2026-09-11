"use client";

import { useState } from "react";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import type { MiseLinkItem, MiseLinkSocial } from "@prisma/client";
import { useMiseLinkState, type EditorPage } from "@/hooks/use-miselink-state";
import { MiseLinkPublicView } from "@/components/miselink/render/miselink-public-view";
import { MainMenuHeader } from "./main-menu-header";
import { MainMenuList } from "./main-menu-list";
import { AddItemDialog } from "./add-item-dialog";
import { ShareDialog } from "./share-dialog";

export function MiseLinkEditor({
  initial,
}: {
  initial: { page: EditorPage; items: MiseLinkItem[]; socials: MiseLinkSocial[] };
}) {
  const state = useMiseLinkState(initial);
  const publicUrl = `miseby.com/${state.page.username}`;
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-12 lg:py-10 xl:px-16">
      <div className="flex flex-col gap-6">
        <MainMenuHeader state={state} />
        <AddItemDialog onAdd={state.addLink} />
        <MainMenuList state={state} />
      </div>

      <aside className="hidden lg:block">
        <div className="fixed right-8 top-1/2 flex h-[calc(100vh-8rem)] max-h-[760px] w-[360px] -translate-y-1/2 flex-col gap-3">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm transition-colors hover:bg-muted"
            title="Compartir enlace"
          >
            <span className="flex-1 truncate text-center text-muted-foreground">{publicUrl}</span>
            <FaArrowUpFromBracket className="size-4 shrink-0 text-muted-foreground" />
          </button>
          <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
            <div className="h-full overflow-hidden">
              <MiseLinkPublicView
                preview
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
    </>
  );
}

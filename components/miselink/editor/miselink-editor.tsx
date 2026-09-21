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

  return (
    <>
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-12 lg:py-10 xl:px-16">
      <div className="flex flex-col gap-6">
        <MainMenuHeader state={state} />
        <AddItemDialog onAdd={state.addLink} planCode={planCode} orgSlug={orgSlug} />
        <MainMenuList state={state} />
      </div>

      <aside className="hidden lg:block">
        <div className="fixed right-8 top-1/2 h-[calc(100vh-8rem)] max-h-[760px] w-[360px] -translate-y-1/2">
          <MiseLinkPhonePreview
            username={state.page.username}
            page={{
              displayName: state.page.displayName,
              bio: state.page.bio,
              avatarUrl: state.page.avatarUrl,
            }}
            items={state.items
              .filter((i) => i.active && i.type !== "collection")
              .map((i) => ({ id: i.id, title: i.title, url: i.url }))}
            socials={state.socials.map((s) => ({ id: s.id, network: s.network, url: s.url }))}
            theme={(state.page as { theme?: unknown }).theme}
            onShare={() => setShareOpen(true)}
          />
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

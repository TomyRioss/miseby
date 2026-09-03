"use client";

import type { MiseLinkItem, MiseLinkSocial } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMiseLinkState, type EditorPage } from "@/hooks/use-miselink-state";
import { MiseLinkPublicView } from "@/components/miselink/render/miselink-public-view";
import { LinksTab } from "./links-tab";
import { ProfileTab } from "./profile-tab";
import { SettingsTab } from "./settings-tab";

export function MiseLinkEditor({
  initial,
}: {
  initial: { page: EditorPage; items: MiseLinkItem[]; socials: MiseLinkSocial[] };
}) {
  const state = useMiseLinkState(initial);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <Tabs defaultValue="links">
          <TabsList>
            <TabsTrigger value="links">Enlaces</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="settings">Ajustes</TabsTrigger>
          </TabsList>
          <TabsContent value="links" className="mt-6">
            <LinksTab state={state} />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <ProfileTab state={state} />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab state={state} />
          </TabsContent>
        </Tabs>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6 overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
          <div className="max-h-[70vh] overflow-y-auto">
            <MiseLinkPublicView
              page={{
                username: state.page.username,
                displayName: state.page.displayName,
                bio: state.page.bio,
                avatarUrl: state.page.avatarUrl,
              }}
              items={state.items
                .filter((i) => i.active)
                .map((i) => ({ id: i.id, title: i.title, url: i.url }))}
              socials={state.socials.map((s) => ({ id: s.id, network: s.network, url: s.url }))}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MiseLinkItem, MiseLinkSocial } from "@prisma/client";
import {
  createLinkAction,
  updateLinkAction,
  deleteLinkAction,
  reorderLinksAction,
  createSocialAction,
  deleteSocialAction,
  updateProfileAction,
  updateUsernameAction,
  setPublishedAction,
} from "@/lib/actions/miselink";
import type { LinkData, MiseLinkItemKind } from "@/lib/validations/miselink";

type NewLinkInput = {
  title: string;
  url?: string;
  type?: MiseLinkItemKind;
  parentId?: string | null;
  data?: LinkData;
};

type EditLinkInput = Partial<{
  title: string;
  url: string;
  active: boolean;
  data: LinkData;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
}>;

export type EditorPage = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  showFollowers: boolean;
  published: boolean;
};

type Initial = {
  page: EditorPage;
  items: MiseLinkItem[];
  socials: MiseLinkSocial[];
};

export function useMiseLinkState(initial: Initial) {
  const router = useRouter();
  const [page, setPage] = useState(initial.page);
  const [items, setItems] = useState(initial.items);
  const [socials, setSocials] = useState(initial.socials);
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    async (
      fn: () => Promise<{ ok: true } | { ok: false; error: string } | { ok: true; id?: string }>,
      onOk?: () => void,
    ): Promise<boolean> => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      onOk?.();
      startTransition(() => router.refresh());
      return true;
    },
    [router],
  );

  return {
    page,
    items,
    socials,
    pending,

    addLink: async (input: NewLinkInput) => {
      const res = await createLinkAction(input);
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      setItems((prev) => [
        ...prev,
        {
          id: res.id ?? crypto.randomUUID(),
          pageId: "",
          type: input.type ?? "link",
          parentId: input.parentId ?? null,
          position: prev.length,
          active: true,
          title: input.title,
          url: input.url ?? null,
          data: input.data ?? {},
          scheduledStart: null,
          scheduledEnd: null,
          clickCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as MiseLinkItem,
      ]);
      toast.success("Enlace agregado");
      startTransition(() => router.refresh());
      return true;
    },

    editLink: (id: string, input: EditLinkInput) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                ...input,
                data: input.data !== undefined ? (input.data ?? {}) : i.data,
              }
            : i,
        ),
      );
      return run(() => updateLinkAction(id, input));
    },

    removeLink: (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return run(
        () => deleteLinkAction(id),
        () => toast.success("Enlace eliminado"),
      );
    },

    reorder: (ids: string[]) => {
      setItems((prev) => ids.map((id) => prev.find((i) => i.id === id)).filter(Boolean) as MiseLinkItem[]);
      return run(() => reorderLinksAction({ ids }));
    },

    addSocial: async (input: { network: string; url: string }) => {
      const res = await createSocialAction(input);
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      setSocials((prev) => [
        ...prev,
        {
          id: res.id ?? crypto.randomUUID(),
          pageId: "",
          network: input.network,
          url: input.url,
          position: prev.length,
        } as MiseLinkSocial,
      ]);
      toast.success("Red social agregada");
      startTransition(() => router.refresh());
      return true;
    },

    removeSocial: (id: string) => {
      setSocials((prev) => prev.filter((s) => s.id !== id));
      return run(() => deleteSocialAction(id));
    },

    saveProfile: (input: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      showFollowers?: boolean;
    }) => {
      setPage((p) => ({ ...p, ...input }));
      return run(
        () => updateProfileAction(input),
        () => toast.success("Perfil actualizado"),
      );
    },

    saveUsername: (username: string) =>
      run(
        () => updateUsernameAction(username),
        () => {
          setPage((p) => ({ ...p, username: username.toLowerCase() }));
          toast.success("Nombre actualizado");
        },
      ),

    setPublished: (v: boolean) =>
      run(
        () => setPublishedAction(v),
        () => {
          setPage((p) => ({ ...p, published: v }));
          toast.success(v ? "Página publicada" : "Página despublicada");
        },
      ),
  };
}

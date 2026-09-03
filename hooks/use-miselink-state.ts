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

export type EditorPage = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
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

    addLink: (input: { title: string; url: string }) =>
      run(
        () => createLinkAction(input),
        () => toast.success("Enlace agregado"),
      ),

    editLink: (id: string, input: Partial<{ title: string; url: string; active: boolean }>) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...input } : i)));
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

    addSocial: (input: { network: string; url: string }) =>
      run(
        () => createSocialAction(input),
        () => toast.success("Red social agregada"),
      ),

    removeSocial: (id: string) => {
      setSocials((prev) => prev.filter((s) => s.id !== id));
      return run(() => deleteSocialAction(id));
    },

    saveProfile: (input: { displayName?: string; bio?: string; avatarUrl?: string }) => {
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

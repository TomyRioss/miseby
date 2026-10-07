"use client";

import { useState } from "react";
import { FiShare } from "react-icons/fi";
import { PageShareDialog } from "./page-share-dialog";

export function MiseLinkTopbar({
  username,
  avatarUrl,
  displayName,
}: {
  username: string;
  avatarUrl: string | null;
  displayName: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full items-center justify-end">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Compartir página"
        className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-transform hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <FiShare className="h-4 w-4" />
      </button>
      <PageShareDialog
        open={open}
        onOpenChange={setOpen}
        username={username}
        avatarUrl={avatarUrl}
        displayName={displayName}
      />
    </div>
  );
}

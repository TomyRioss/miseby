import { UserRound } from "lucide-react";
import type { RenderPage } from "./types";

export function MiseLinkHeader({ page }: { page: RenderPage }) {
  const name = page.displayName?.trim() || `@${page.username}`;
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <div className="h-24 w-24 overflow-hidden rounded-full border border-border bg-muted">
        {page.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <UserRound className="h-10 w-10" />
          </div>
        )}
      </div>
      <h1 className="text-lg font-semibold text-foreground">{name}</h1>
      {page.bio?.trim() ? (
        <p className="max-w-xs text-sm text-muted-foreground">{page.bio}</p>
      ) : null}
    </header>
  );
}

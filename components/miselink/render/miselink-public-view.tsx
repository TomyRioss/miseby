import Link from "next/link";
import { MiseLinkHeader } from "./miselink-header";
import { MiseLinkSocials } from "./miselink-socials";
import { MiseLinkButton } from "./miselink-button";
import type { RenderPage, RenderItem, RenderSocial } from "./types";

export function MiseLinkPublicView({
  page,
  items,
  socials,
}: {
  page: RenderPage;
  items: RenderItem[];
  socials: RenderSocial[];
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center gap-6 px-4 py-10">
      <MiseLinkHeader page={page} />
      <MiseLinkSocials socials={socials} />
      <div className="flex w-full flex-col gap-3">
        {items.map((item) => (
          <MiseLinkButton key={item.id} item={item} />
        ))}
      </div>
      <footer className="mt-auto pt-8 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Hecho con MISE BY
        </Link>
      </footer>
    </div>
  );
}

import type { RenderItem } from "./types";

export function MiseLinkButton({ item }: { item: RenderItem }) {
  if (!item.url || !item.title) return null;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="block w-full rounded-2xl border border-border bg-card px-5 py-4 text-center text-sm font-medium text-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      {item.title}
    </a>
  );
}

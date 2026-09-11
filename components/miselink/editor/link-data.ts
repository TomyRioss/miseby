import type { MiseLinkItem } from "@prisma/client";

export type LinkDataView = {
  thumbnail: string;
  highlight: boolean;
  locked: boolean;
};

/** Lee el JSON `data` del item de forma tolerante (puede venir vacío o parcial). */
export function readLinkData(item: MiseLinkItem): LinkDataView {
  const d = (item.data ?? {}) as Record<string, unknown>;
  return {
    thumbnail: typeof d.thumbnail === "string" ? d.thumbnail : "",
    highlight: d.highlight === true,
    locked: d.locked === true,
  };
}

/** Convierte un Date (o null) al valor que espera `<input type="datetime-local">`. */
export function toLocalInput(value: Date | string | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

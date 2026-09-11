import type { MiseLinkTheme } from "@/lib/miselink/theme";

export type RenderPage = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type { MiseLinkTheme };

export type RenderItem = {
  id: string;
  title: string | null;
  url: string | null;
};

export type RenderSocial = {
  id: string;
  network: string;
  url: string;
};

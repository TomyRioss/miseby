import type { IconType } from "react-icons";
import {
  SiInstagram,
  SiTiktok,
  SiYoutube,
  SiX,
  SiFacebook,
  SiSpotify,
} from "react-icons/si";
import { FaGlobe, FaMapLocationDot, FaLinkedin } from "react-icons/fa6";
import type { SocialNetwork } from "@/lib/validations/miselink";

export type SocialMeta = {
  label: string;
  icon: IconType;
  color: string;
  bg: string;
  desc: string;
  placeholder: string;
  prefix: string;
  hint: string;
};

export const MISELINK_SOCIAL_NETWORKS: Record<SocialNetwork, SocialMeta> = {
  instagram: {
    label: "Instagram",
    icon: SiInstagram,
    color: "#D62976",
    bg: "linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)",
    desc: "Mostrá tus posts y reels",
    placeholder: "@tu_usuario o https://instagram.com/tu_usuario",
    prefix: "https://instagram.com/",
    hint: "Pegá tu link o escribí tu @usuario",
  },
  tiktok: {
    label: "TikTok",
    icon: SiTiktok,
    color: "#000000",
    bg: "#000000",
    desc: "Compartí tus TikToks",
    placeholder: "@tu_usuario o https://tiktok.com/@tu_usuario",
    prefix: "https://tiktok.com/@",
    hint: "Pegá tu link o escribí tu @usuario",
  },
  youtube: {
    label: "YouTube",
    icon: SiYoutube,
    color: "#FF0000",
    bg: "#FF0000",
    desc: "Compartí tus videos",
    placeholder: "https://youtube.com/@tu_canal",
    prefix: "https://youtube.com/",
    hint: "Pegá el link de tu canal o video",
  },
  x: {
    label: "X",
    icon: SiX,
    color: "#000000",
    bg: "#000000",
    desc: "Tu perfil de X (Twitter)",
    placeholder: "@tu_usuario o https://x.com/tu_usuario",
    prefix: "https://x.com/",
    hint: "Pegá tu link o escribí tu @usuario",
  },
  linkedin: {
    label: "LinkedIn",
    icon: FaLinkedin,
    color: "#0A66C2",
    bg: "#0A66C2",
    desc: "Tu perfil profesional",
    placeholder: "https://linkedin.com/in/tu_usuario",
    prefix: "https://linkedin.com/in/",
    hint: "Pegá el link de tu perfil",
  },
  facebook: {
    label: "Facebook",
    icon: SiFacebook,
    color: "#1877F2",
    bg: "#1877F2",
    desc: "Tu página o perfil",
    placeholder: "https://facebook.com/tu_pagina",
    prefix: "https://facebook.com/",
    hint: "Pegá el link de tu página",
  },
  spotify: {
    label: "Spotify",
    icon: SiSpotify,
    color: "#1DB954",
    bg: "#1DB954",
    desc: "Tu música favorita",
    placeholder: "https://open.spotify.com/...",
    prefix: "https://open.spotify.com/",
    hint: "Pegá el link de tu playlist o perfil",
  },
  website: {
    label: "Link personalizado",
    icon: FaGlobe,
    color: "#0E88E2",
    bg: "#0E88E2",
    desc: "Cualquier link propio",
    placeholder: "https://tusitio.com",
    prefix: "https://",
    hint: "Pegá cualquier URL válida",
  },
  maps: {
    label: "Ubicación",
    icon: FaMapLocationDot,
    color: "#EA4335",
    bg: "#EA4335",
    desc: "Tu ubicación en Maps",
    placeholder: "https://maps.google.com/?q=Tu+Negocio",
    prefix: "https://maps.google.com/?q=",
    hint: "Pegá el link de Google Maps o escribí tu dirección",
  },
};

/** Normaliza input suelto (@user, dirección, url sin https) a URL válida. */
export function normalizeSocialUrl(network: SocialNetwork, raw: string): string {
  const v = raw.trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;

  const user = v.replace(/^@/, "").trim();
  switch (network) {
    case "instagram":
      return `https://instagram.com/${user}`;
    case "tiktok":
      return `https://tiktok.com/@${user.replace(/^@/, "")}`;
    case "youtube":
      return user.includes("/") ? `https://youtube.com/${user}` : `https://youtube.com/@${user}`;
    case "x":
      return `https://x.com/${user}`;
    case "linkedin":
      return user.includes("/") ? `https://${user}` : `https://linkedin.com/in/${user}`;
    case "facebook":
      return `https://facebook.com/${user}`;
    case "spotify":
      return v;
    case "maps":
      return `https://maps.google.com/?q=${encodeURIComponent(v)}`;
    case "website":
    default:
      return `https://${v}`;
  }
}

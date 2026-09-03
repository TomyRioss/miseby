import type { IconType } from "react-icons";
import { SiInstagram, SiTiktok, SiYoutube, SiX, SiFacebook, SiSpotify } from "react-icons/si";
import { FaGlobe } from "react-icons/fa6";
import type { SocialNetwork } from "@/lib/validations/miselink";

// Los iconos de marca no existen en la versión instalada de lucide-react (1.34),
// así que se usan de react-icons (Simple Icons).
export const MISELINK_SOCIAL_NETWORKS: Record<
  SocialNetwork,
  { label: string; icon: IconType }
> = {
  instagram: { label: "Instagram", icon: SiInstagram },
  tiktok: { label: "TikTok", icon: SiTiktok },
  youtube: { label: "YouTube", icon: SiYoutube },
  x: { label: "X / Twitter", icon: SiX },
  facebook: { label: "Facebook", icon: SiFacebook },
  spotify: { label: "Spotify", icon: SiSpotify },
  website: { label: "Sitio web", icon: FaGlobe },
};

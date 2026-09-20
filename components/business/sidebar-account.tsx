import { getAccountDisplay } from "@/lib/auth/session";
import { SidebarAccountButton } from "./sidebar-account-button";

/**
 * Slot de cuenta para el sidebar de negocio (server).
 * Resuelve nombre + mail y renderiza el botón compartido.
 * Se pasa como `account={<SidebarAccount />}` al BusinessSidebar.
 */
export async function SidebarAccount() {
  const account = await getAccountDisplay();
  if (!account) return null;
  return <SidebarAccountButton userName={account.name} userEmail={account.email} />;
}

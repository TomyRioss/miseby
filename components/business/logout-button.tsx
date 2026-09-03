"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await signOut({ redirect: false });
        router.replace("/login");
      }}
      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:block">Salir</span>
    </button>
  );
}

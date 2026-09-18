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
      className="cursor-pointer flex items-center gap-2 rounded-full border border-[#00E676]/70 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:block">Salir</span>
    </button>
  );
}

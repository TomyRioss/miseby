"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, LogOut, Settings, User } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Bloque de cuenta compartido del sidebar de negocio.
 * Un solo componente para todos los planes: nombre arriba,
 * mail completo en gris abajo (sin truncar).
 */
export function SidebarAccountButton({ userName, userEmail }: { userName: string; userEmail: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("[logout]", e);
    }
    router.replace("/login");
  };

  return (
    <DropdownMenu>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              aria-haspopup="menu"
              aria-label={`Cuenta: ${userName} — ${userEmail}`}
              className="cursor-pointer flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                <User className="h-5 w-5 shrink-0 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{userName}</span>
                <span className="block break-all text-[11px] leading-snug text-muted-foreground">{userEmail}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className="max-w-[min(20rem,calc(100vw-2rem))] break-words"
        >
          <span className="block select-all text-xs font-medium">{userName}</span>
          <span className="block select-all text-xs text-muted-foreground">{userEmail}</span>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(20rem,calc(100vw-2rem))] p-1.5"
      >
        <DropdownMenuLabel className="px-3 py-3">
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Cuenta
          </span>
          <span className="block text-xs font-semibold text-foreground">{userName}</span>
          <span
            aria-label={userEmail}
            className="block max-w-full select-all whitespace-normal break-words text-xs font-medium normal-case leading-relaxed tracking-normal text-muted-foreground"
          >
            {userEmail}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide focus:bg-accent focus:text-accent-foreground">
          <Link href="/dashboard/cuenta">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            CUENTA
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide focus:bg-accent focus:text-accent-foreground">
          <Link href="/dashboard/billing">
            <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
            BILLING &amp; PLANS
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide focus:bg-accent focus:text-accent-foreground">
          <Link href="/dashboard/ajustes">
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            AJUSTES
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="h-4 w-4 shrink-0 text-destructive/70" />
          Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

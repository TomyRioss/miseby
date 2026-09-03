import Link from "next/link";
import { Building2, Link2 } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { LogoutButton } from "@/components/business/logout-button";

export function BusinessHeader({ userLabel }: { userLabel: string }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <MiseMark />
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-muted-foreground sm:block">{userLabel}</span>
        <LogoutButton />
      </div>
    </header>
  );
}

export function BusinessSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
      <nav className="mt-2 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Building2 className="h-4 w-4" />
          Inicio
        </Link>
        <Link
          href="/dashboard/miselink"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Link2 className="h-4 w-4" />
          MISE LINK
        </Link>
      </nav>
    </aside>
  );
}

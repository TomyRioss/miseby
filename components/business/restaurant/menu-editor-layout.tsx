"use client";

import { Separator } from "@/components/ui/separator";

/**
 * Layout editor + preview. Misma grilla que MiseLink Links:
 * 1fr + separator + 360px, preview fijo centrado en viewport en desktop,
 * apilado en mobile. El teléfono se ve completo sin scrollear.
 */
export function MenuEditorLayout({ left, preview }: { left: React.ReactNode; preview: React.ReactNode }) {
  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_auto_360px]">
      <div className="flex min-w-0 flex-col gap-6">{left}</div>

      <Separator orientation="vertical" className="hidden lg:block" />

      <aside className="hidden lg:block">
        <div className="fixed right-8 top-1/2 h-[calc(100vh-8rem)] max-h-[760px] w-[360px] -translate-y-1/2">{preview}</div>
      </aside>
      <div className="h-[620px] lg:hidden">{preview}</div>
    </div>
  );
}

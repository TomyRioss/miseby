"use client";

import { FaPencil } from "react-icons/fa6";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";
import { SocialsTabSection } from "./socials-tab-section";

type State = ReturnType<typeof useMiseLinkState>;

export function SocialsEditPopover({ state }: { state: State }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Editar redes sociales"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:text-foreground hover:shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <FaPencil className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <SocialsTabSection state={state} />
      </PopoverContent>
    </Popover>
  );
}

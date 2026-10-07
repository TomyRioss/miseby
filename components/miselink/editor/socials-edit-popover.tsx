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
          className="flex size-7 items-center justify-center rounded-full border border-[#CBD5E1] bg-white text-[#475569] transition-colors hover:border-[#0A2540] hover:bg-[#F1F5F9] hover:text-[#0A2540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A2540] focus-visible:ring-offset-2"
        >
          <FaPencil className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 border-[#E2E8F0] bg-[#FFFFFF] text-[#0A2540]">
        <SocialsTabSection state={state} />
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { Check } from "lucide-react";
import { PLANS, type PlanSlug } from "@/lib/landing/plans";
import { cn } from "@/lib/utils";

export { planSlugToCode, isPlanSlug, PLAN_SLUG_TO_CODE } from "@/lib/landing/plans";

interface PlanSelectorProps {
  value: PlanSlug;
  onChange: (slug: PlanSlug) => void;
}

export function PlanSelector({ value, onChange }: PlanSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Elegí tu plan" className="grid gap-3 sm:grid-cols-3">
      {PLANS.map((plan) => {
        const selected = value === plan.slug;
        return (
          <button
            key={plan.slug}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(plan.slug)}
            className={cn(
              "relative flex flex-col rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E88E2]/60",
              selected
                ? "border-[#0E88E2] bg-[#0E88E2]/5"
                : "border-border bg-card hover:border-muted-foreground/40"
            )}
          >
            <span
              aria-hidden
              style={{ backgroundColor: plan.accent }}
              className="mb-3 h-1.5 w-10 rounded-full"
            />
            <span className="text-sm font-bold text-foreground">{plan.name}</span>
            <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {plan.tagline}
            </span>
            <span
              aria-hidden
              className={cn(
                "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2",
                selected ? "border-[#0E88E2] bg-[#0E88E2] text-white" : "border-muted text-transparent"
              )}
            >
              <Check className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}


import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";

const COLORS: Record<string, string> = {
  blue: "bg-blue-50 text-[#075296]",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  color = "blue",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: keyof typeof COLORS;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            <CountUp value={value} />
          </p>
        </div>
        <div className={`rounded-xl p-3 ${COLORS[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

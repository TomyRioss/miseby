"use client";

export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={`cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors ${
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background hover:bg-muted"
            }`}
          >
            <span className="block text-sm font-semibold">{o.label}</span>
            {o.hint ? <span className="block text-xs opacity-70">{o.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"
      />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="font-mono text-xs uppercase text-muted-foreground">{value}</span>
    </label>
  );
}

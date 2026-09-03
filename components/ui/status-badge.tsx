const COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-700 border-green-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  red: "bg-red-100 text-red-700 border-red-200",
  gray: "bg-gray-100 text-gray-500 border-gray-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
};

export function StatusBadge({
  label,
  color = "gray",
  className = "",
}: {
  label: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${COLORS[color] || COLORS.gray} ${className}`}
    >
      {label}
    </span>
  );
}

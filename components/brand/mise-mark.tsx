export function MiseMark({
  className = "",
  suffix,
  tone = "brand",
}: {
  className?: string;
  suffix?: string;
  tone?: "brand" | "white";
}) {
  const first = tone === "white" ? "text-white" : "text-[#075296]";
  const rest = tone === "white" ? "text-white" : "text-[#0E88E2]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-display text-xl font-bold tracking-tight ${className}`}
    >
      <span className={first}>MISE</span>
      <span className={rest}>BY</span>
      {suffix ? (
        <>
          <span className={rest} aria-hidden>
            &bull;
          </span>
          <span className={rest}>{suffix}</span>
        </>
      ) : null}
    </span>
  );
}

export function MiseMark({
  className = "",
  suffix,
}: {
  className?: string;
  suffix?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-display text-xl font-bold tracking-tight ${className}`}
    >
      <span className="text-[#075296]">MISE</span>
      <span className="text-[#0E88E2]">BY</span>
      {suffix ? (
        <>
          <span className="text-[#0E88E2]" aria-hidden>
            &bull;
          </span>
          <span className="text-[#0E88E2]">{suffix}</span>
        </>
      ) : null}
    </span>
  );
}

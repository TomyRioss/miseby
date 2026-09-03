export function MiseMark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-xl font-bold tracking-tight ${className}`}>
      <span className="text-[#075296]">MISE</span>
      <span className="text-[#0E88E2]"> BY</span>
    </span>
  );
}

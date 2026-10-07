export function Bar({ value, max, color = '#e8b830' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-[8px] w-full border border-[#333333] bg-[#0a0a0a]">
      <div
        className="h-full"
        style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%`, backgroundColor: color }}
      />
    </div>
  );
}
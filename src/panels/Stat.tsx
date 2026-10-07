export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'ok' | 'bad' | 'warn';
}) {
  const color =
    tone === 'ok' ? '#7fd07f' : tone === 'bad' ? '#ff7777' : tone === 'warn' ? '#e8b830' : undefined;
  return (
    <div className="retro-panel-inset p-3 flex flex-col gap-1">
      <span className="admin-label">{label}</span>
      <span className="admin-mono text-[1.1rem] leading-none" style={{ color }} title={label}>
        {value}
      </span>
    </div>
  );
}
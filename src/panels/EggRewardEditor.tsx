import type { EggCatalogs, EggSelector, EggSelectorMode, EggSpec, EggStatKey } from '../types';

const STAT_ORDER: EggStatKey[] = ['attack', 'defense', 'speed', 'vig'];
const STAT_LABELS: Record<EggStatKey, string> = {
  attack: 'ATK',
  defense: 'DEF',
  speed: 'SPD',
  vig: 'VIG',
};

type AttrKind = 'species' | 'gender' | 'color' | 'stat';

function modesFor(kind: AttrKind): EggSelectorMode[] {
  if (kind === 'color') return ['fixed', 'pool', 'range', 'random'];
  if (kind === 'stat') return ['fixed', 'range', 'random'];
  return ['fixed', 'pool', 'random'];
}

function defaultSelector(kind: AttrKind, mode: EggSelectorMode, catalogs: EggCatalogs): EggSelector {
  switch (mode) {
    case 'random':
      return { mode: 'random' };
    case 'fixed':
      if (kind === 'species') return { mode: 'fixed', value: catalogs.species[0]?.key ?? '' };
      if (kind === 'gender') return { mode: 'fixed', value: catalogs.genders[0] ?? 'male' };
      if (kind === 'color') return { mode: 'fixed', value: 0 };
      return { mode: 'fixed', value: 1 };
    case 'pool':
      if (kind === 'species') {
        return { mode: 'pool', values: catalogs.species[0] ? [catalogs.species[0].key] : [] };
      }
      if (kind === 'gender') return { mode: 'pool', values: [...catalogs.genders] };
      if (kind === 'color') return { mode: 'pool', values: [0] };
      return { mode: 'pool', values: [1] };
    case 'range':
      if (kind === 'color') return { mode: 'range', min: 0, max: catalogs.maxColor };
      return { mode: 'range', min: 1, max: 10 };
    default:
      return { mode: 'random' };
  }
}

function toggle(list: (string | number)[], value: string | number): (string | number)[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

interface AttributeEditorProps {
  label: string;
  kind: AttrKind;
  selector: EggSelector;
  catalogs: EggCatalogs;
  onChange: (next: EggSelector) => void;
}

function AttributeEditor({ label, kind, selector, catalogs, onChange }: AttributeEditorProps) {
  const modes = modesFor(kind);
  const value = selector.mode === 'fixed' ? selector.value : '';
  const pool = selector.mode === 'pool' ? selector.values : [];

  function renderValue() {
    if (selector.mode === 'random') {
      return <span className="text-[0.72rem] text-[#777777]">Random from all available</span>;
    }

    if (kind === 'species') {
      if (selector.mode === 'fixed') {
        return (
          <select
            className="retro-input px-2 py-1 text-[0.8rem] max-w-[18rem]"
            value={value}
            onChange={(e) => onChange({ mode: 'fixed', value: e.target.value })}
          >
            {catalogs.species.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        );
      }
      return (
        <select
          multiple
          size={6}
          className="retro-input px-2 py-1 text-[0.8rem] min-w-[14rem]"
          value={pool as string[]}
          onChange={(e) =>
            onChange({ mode: 'pool', values: Array.from(e.target.selectedOptions).map((o) => o.value) })
          }
        >
          {catalogs.species.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name}
            </option>
          ))}
        </select>
      );
    }

    if (kind === 'gender') {
      if (selector.mode === 'fixed') {
        return (
          <select
            className="retro-input px-2 py-1 text-[0.8rem]"
            value={value}
            onChange={(e) => onChange({ mode: 'fixed', value: e.target.value })}
          >
            {catalogs.genders.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        );
      }
      return (
        <div className="flex gap-3">
          {catalogs.genders.map((g) => (
            <label key={g} className="flex items-center gap-1 text-[0.8rem] text-[#c0c0c0]">
              <input
                type="checkbox"
                checked={pool.includes(g)}
                onChange={() => onChange({ mode: 'pool', values: toggle(pool, g) })}
              />
              {g}
            </label>
          ))}
        </div>
      );
    }

    if (kind === 'color') {
      if (selector.mode === 'fixed') {
        return (
          <select
            className="retro-input px-2 py-1 text-[0.8rem]"
            value={value}
            onChange={(e) => onChange({ mode: 'fixed', value: Number(e.target.value) })}
          >
            {catalogs.colors.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value === 0 ? 'default' : `${c.value} · ${c.name}`}
              </option>
            ))}
          </select>
        );
      }
      if (selector.mode === 'range') {
        return (
          <div className="flex items-center gap-2 text-[0.8rem] text-[#c0c0c0]">
            <input
              type="number"
              min={0}
              max={catalogs.maxColor}
              className="retro-input px-2 py-1 w-20 text-[0.8rem]"
              value={selector.min}
              onChange={(e) => onChange({ ...selector, min: Number(e.target.value) })}
            />
            <span>–</span>
            <input
              type="number"
              min={0}
              max={catalogs.maxColor}
              className="retro-input px-2 py-1 w-20 text-[0.8rem]"
              value={selector.max}
              onChange={(e) => onChange({ ...selector, max: Number(e.target.value) })}
            />
          </div>
        );
      }
      return (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {catalogs.colors.map((c) => (
            <label key={c.value} className="flex items-center gap-1 text-[0.75rem] text-[#c0c0c0]">
              <input
                type="checkbox"
                checked={pool.includes(c.value)}
                onChange={() => onChange({ mode: 'pool', values: toggle(pool, c.value) })}
              />
              {c.value === 0 ? 'default' : c.name}
            </label>
          ))}
        </div>
      );
    }

    // stat
    if (selector.mode === 'fixed') {
      return (
        <input
          type="number"
          min={1}
          max={catalogs.maxStat}
          className="retro-input px-2 py-1 w-24 text-[0.8rem]"
          value={value}
          onChange={(e) => onChange({ mode: 'fixed', value: Number(e.target.value) })}
        />
      );
    }
    if (selector.mode !== 'range') return null;
    return (
      <div className="flex items-center gap-2 text-[0.8rem] text-[#c0c0c0]">
        <input
          type="number"
          min={1}
          max={catalogs.maxStat}
          className="retro-input px-2 py-1 w-20 text-[0.8rem]"
          value={selector.min}
          onChange={(e) => onChange({ ...selector, min: Number(e.target.value) })}
        />
        <span>–</span>
        <input
          type="number"
          min={1}
          max={catalogs.maxStat}
          className="retro-input px-2 py-1 w-20 text-[0.8rem]"
          value={selector.max}
          onChange={(e) => onChange({ ...selector, max: Number(e.target.value) })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-[0.75rem] text-[#888888]">{label}</span>
      <select
        className="retro-input px-2 py-1 text-[0.8rem]"
        value={selector.mode}
        onChange={(e) =>
          onChange(defaultSelector(kind, e.target.value as EggSelectorMode, catalogs))
        }
      >
        {modes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      {renderValue()}
    </div>
  );
}

export function EggRewardEditor({
  value,
  catalogs,
  onChange,
}: {
  value: EggSpec;
  catalogs: EggCatalogs;
  onChange: (next: EggSpec) => void;
}) {
  const stats = value.stats || {};
  return (
    <div className="flex flex-col gap-2">
      <AttributeEditor
        label="Species"
        kind="species"
        selector={value.species}
        catalogs={catalogs}
        onChange={(species) => onChange({ ...value, species })}
      />
      <AttributeEditor
        label="Gender"
        kind="gender"
        selector={value.gender}
        catalogs={catalogs}
        onChange={(gender) => onChange({ ...value, gender })}
      />
      <AttributeEditor
        label="Color"
        kind="color"
        selector={value.color}
        catalogs={catalogs}
        onChange={(color) => onChange({ ...value, color })}
      />
      <div className="mt-1 border-t border-[#222222] pt-2 flex flex-col gap-2">
        {STAT_ORDER.map((key) => (
          <AttributeEditor
            key={key}
            label={STAT_LABELS[key]}
            kind="stat"
            selector={stats[key] || { mode: 'random' }}
            catalogs={catalogs}
            onChange={(sel) => onChange({ ...value, stats: { ...stats, [key]: sel } })}
          />
        ))}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, RefreshCw, Save, Trash2, X, Pencil } from 'lucide-react';
import { api } from '../api';
import { EggRewardEditor } from './EggRewardEditor';
import type {
  CodeResponse,
  CodesCatalogs,
  CodesResponse,
  EggSelector,
  EggSpec,
  RedeemCode,
  Reward,
  RewardType,
} from '../types';

const REWARD_TYPES: { value: RewardType; label: string }[] = [
  { value: 'bonds', label: 'Helix Bonds' },
  { value: 'lore', label: 'Lore Points' },
  { value: 'stat_points', label: 'Stat Points' },
  { value: 'resource', label: 'Resource' },
  { value: 'item', label: 'Item' },
  { value: 'blueprint', label: 'Blueprint' },
  { value: 'cosmetic', label: 'Cosmetic' },
  { value: 'egg', label: 'Hatchable Egg' },
];

const COSMETIC_KINDS = ['avatar', 'frame', 'plate', 'nameColor'];

function defaultEggSpec(): EggSpec {
  const random: EggSelector = { mode: 'random' };
  return {
    species: random,
    gender: random,
    color: random,
    stats: { attack: random, defense: random, speed: random, vig: random },
  };
}

function defaultReward(type: RewardType, catalogs: CodesCatalogs | null): Reward {
  switch (type) {
    case 'resource':
      return { type, resource: catalogs?.resources[0]?.key, amount: 1 };
    case 'item':
      return { type, item: catalogs?.items[0]?.key, amount: 1 };
    case 'blueprint':
      return { type, blueprint: catalogs?.blueprints[0]?.key, tier: '' };
    case 'cosmetic':
      return { type, kind: 'frame', key: catalogs?.cosmetics.frame?.[0]?.key ?? '' };
    case 'egg':
      return { type, amount: 1, egg: defaultEggSpec() };
    default:
      return { type, amount: 1 };
  }
}

function describeSelectorShort(sel: EggSelector | undefined): string {
  if (!sel || sel.mode === 'random') return 'random';
  if (sel.mode === 'fixed') return String(sel.value);
  if (sel.mode === 'pool') return `pool(${sel.values.length})`;
  return `${sel.min}-${sel.max}`;
}

function rewardLabel(reward: Reward, catalogs: CodesCatalogs | null): string {
  const find = (list: { key: string; name: string }[] | undefined, key?: string) =>
    list?.find((e) => e.key === key)?.name ?? key ?? '?';
  switch (reward.type) {
    case 'bonds':
      return `${reward.amount} Helix Bonds`;
    case 'lore':
      return `${reward.amount} Lore Points`;
    case 'stat_points':
      return `${reward.amount} Stat Points`;
    case 'resource':
      return `${reward.amount}× ${find(catalogs?.resources, reward.resource)}`;
    case 'item':
      return `${reward.amount}× ${find(catalogs?.items, reward.item)}`;
    case 'blueprint':
      return `${find(catalogs?.blueprints, reward.blueprint)}${reward.tier ? ` (${reward.tier})` : ''}`;
    case 'cosmetic':
      return `${reward.kind}: ${find(catalogs?.cosmetics[reward.kind || ''], reward.key)}`;
    case 'egg': {
      const egg = reward.egg;
      if (!egg) return 'Hatchable Egg';
      const species =
        egg.species.mode === 'fixed'
          ? find(catalogs?.eggs.species, egg.species.value as string)
          : egg.species.mode === 'pool'
            ? `pool(${egg.species.values.length})`
            : 'random';
      const attrs = [
        `species ${species}`,
        `gender ${describeSelectorShort(egg.gender)}`,
        `color ${describeSelectorShort(egg.color)}`,
        `stats ${describeSelectorShort(egg.stats?.attack)}/${describeSelectorShort(egg.stats?.defense)}/${describeSelectorShort(egg.stats?.speed)}/${describeSelectorShort(egg.stats?.vig)}`,
      ];
      return `Egg ×${reward.amount ?? 1}: ${attrs.join(', ')}`;
    }
    default:
      return reward.type;
  }
}

export function CodesPanel() {
  const [catalogs, setCatalogs] = useState<CodesCatalogs | null>(null);
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [active, setActive] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [codesRes, catalogsRes] = await Promise.all([
        api.get<CodesResponse>('/api/admin/codes'),
        api.get<CodesCatalogs>('/api/admin/codes/catalogs'),
      ]);
      setCodes(codesRes.codes);
      setCatalogs(catalogsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setCode('');
    setLabel('');
    setActive(true);
    setRewards([]);
    setEditing(null);
    setNotice(null);
  }

  function editCode(entry: RedeemCode) {
    setCode(entry.code);
    setLabel(entry.label || '');
    setActive(entry.active);
    setRewards(entry.rewards.map((r) => ({ ...r })));
    setEditing(entry.code);
    setNotice(null);
    setError(null);
  }

  function addReward() {
    setRewards((prev) => [...prev, defaultReward('bonds', catalogs)]);
  }

  function updateReward(index: number, patch: Partial<Reward>) {
    setRewards((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function changeType(index: number, type: RewardType) {
    setRewards((prev) => prev.map((r, i) => (i === index ? defaultReward(type, catalogs) : r)));
  }

  function removeReward(index: number) {
    setRewards((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const res = await api.post<CodeResponse>('/api/admin/codes', {
        code,
        label,
        active,
        rewards,
      });
      setNotice(`Saved ${res.code.code} with ${res.code.rewards.length} reward(s).`);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save code');
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: RedeemCode) {
    if (!window.confirm(`Delete code ${entry.code}? Players who already redeemed it keep their rewards.`)) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await api.del(`/api/admin/codes/${encodeURIComponent(entry.code)}`);
      setNotice(`Deleted ${entry.code}.`);
      if (editing === entry.code) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete code');
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Redeem Codes</h2>
        <button type="button" className="retro-btn text-[0.75rem]" onClick={() => void load()}>
          <span className="flex items-center gap-1">
            <RefreshCw size={12} /> Refresh
          </span>
        </button>
        <span className="admin-label">{codes.length} code(s)</span>
      </div>

      {error && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {error}
        </div>
      )}
      {notice && (
        <div className="border-2 border-[#3f7a3f] bg-[#081a08] px-3 py-2 text-[0.85rem] text-[#9fdd9f]">
          {notice}
        </div>
      )}

      <div className="retro-window overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-[#888888]">Loading codes…</div>
        ) : codes.length === 0 ? (
          <div className="p-6 text-center text-[#888888]">No codes yet. Create one below.</div>
        ) : (
          <table className="w-full border-collapse text-[0.85rem]">
            <thead>
              <tr className="text-left">
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Code</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Label</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Rewards</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Status</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((entry) => (
                <tr key={entry.code} className="odd:bg-[#0a0a0a] align-top">
                  <td className="px-3 py-2 border-b border-[#222222] text-[#b8d8f8] admin-mono">
                    {entry.code}
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] text-[#c0c0c0]">
                    {entry.label || <span className="text-[#555555]">—</span>}
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] text-[#a0a0a0]">
                    {entry.rewards.map((r, i) => (
                      <div key={i} className="text-[0.78rem] leading-snug">
                        {rewardLabel(r, catalogs)}
                      </div>
                    ))}
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222]">
                    <span style={{ color: entry.active ? '#7fd07f' : '#ff7777' }}>
                      {entry.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="retro-btn text-[0.72rem] mr-2"
                      onClick={() => editCode(entry)}
                    >
                      <span className="flex items-center gap-1">
                        <Pencil size={11} /> Edit
                      </span>
                    </button>
                    <button
                      type="button"
                      className="retro-btn text-[0.72rem]"
                      onClick={() => void remove(entry)}
                    >
                      <span className="flex items-center gap-1">
                        <Trash2 size={11} /> Delete
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form className="retro-window p-4 flex flex-col gap-3" onSubmit={submit}>
        <span className="admin-label">{editing ? `Edit code ${editing}` : 'Create a code'}</span>

        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-[#888888]">Code (A-Z, 0-9, _ -)</span>
            <input
              className="retro-input px-3 py-1.5 w-52 admin-mono uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={!!editing}
              placeholder="PRIMORDIA"
              spellCheck={false}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-[#888888]">Label (optional)</span>
            <input
              className="retro-input px-3 py-1.5 w-56"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Launch promo"
              maxLength={60}
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-[0.85rem] text-[#c0c0c0]">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="admin-label">Rewards</span>
          <button type="button" className="retro-btn text-[0.72rem]" onClick={addReward}>
            <span className="flex items-center gap-1">
              <Plus size={11} /> Add reward
            </span>
          </button>
        </div>

        {rewards.length === 0 && (
          <p className="text-[0.8rem] text-[#666666]">
            No rewards yet. Add at least one — a code with no rewards is rejected.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {rewards.map((reward, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center gap-2 border border-[#222222] bg-[#0a0a0a] px-2 py-2"
            >
              <select
                className="retro-input px-2 py-1 text-[0.8rem]"
                value={reward.type}
                onChange={(e) => changeType(index, e.target.value as RewardType)}
              >
                {REWARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {(reward.type === 'bonds' ||
                reward.type === 'lore' ||
                reward.type === 'stat_points') && (
                <input
                  type="number"
                  min={1}
                  className="retro-input px-2 py-1 w-28 text-[0.8rem]"
                  value={reward.amount ?? 1}
                  onChange={(e) => updateReward(index, { amount: Number(e.target.value) })}
                />
              )}

              {reward.type === 'resource' && (
                <>
                  <select
                    className="retro-input px-2 py-1 text-[0.8rem] max-w-[16rem]"
                    value={reward.resource ?? ''}
                    onChange={(e) => updateReward(index, { resource: e.target.value })}
                  >
                    {catalogs?.resources.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="retro-input px-2 py-1 w-28 text-[0.8rem]"
                    value={reward.amount ?? 1}
                    onChange={(e) => updateReward(index, { amount: Number(e.target.value) })}
                  />
                </>
              )}

              {reward.type === 'item' && (
                <>
                  <select
                    className="retro-input px-2 py-1 text-[0.8rem] max-w-[16rem]"
                    value={reward.item ?? ''}
                    onChange={(e) => updateReward(index, { item: e.target.value })}
                  >
                    {catalogs?.items.map((it) => (
                      <option key={it.key} value={it.key}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    className="retro-input px-2 py-1 w-28 text-[0.8rem]"
                    value={reward.amount ?? 1}
                    onChange={(e) => updateReward(index, { amount: Number(e.target.value) })}
                  />
                </>
              )}

              {reward.type === 'blueprint' && (
                <>
                  <select
                    className="retro-input px-2 py-1 text-[0.8rem] max-w-[16rem]"
                    value={reward.blueprint ?? ''}
                    onChange={(e) => updateReward(index, { blueprint: e.target.value })}
                  >
                    {catalogs?.blueprints.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="retro-input px-2 py-1 text-[0.8rem]"
                    value={reward.tier ?? ''}
                    onChange={(e) => updateReward(index, { tier: e.target.value })}
                  >
                    <option value="">Random tier</option>
                    {catalogs?.blueprintTiers.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {reward.type === 'cosmetic' && (
                <>
                  <select
                    className="retro-input px-2 py-1 text-[0.8rem]"
                    value={reward.kind ?? 'frame'}
                    onChange={(e) =>
                      updateReward(index, {
                        kind: e.target.value,
                        key: catalogs?.cosmetics[e.target.value]?.[0]?.key ?? '',
                      })
                    }
                  >
                    {COSMETIC_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <select
                    className="retro-input px-2 py-1 text-[0.8rem] max-w-[16rem]"
                    value={reward.key ?? ''}
                    onChange={(e) => updateReward(index, { key: e.target.value })}
                  >
                    {catalogs?.cosmetics[reward.kind || 'frame']?.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {reward.type === 'egg' && catalogs && (
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-[0.75rem] text-[#888888]">Quantity</span>
                    <input
                      type="number"
                      min={1}
                      max={catalogs.eggs.maxEggAmount}
                      className="retro-input px-2 py-1 w-24 text-[0.8rem]"
                      value={reward.amount ?? 1}
                      onChange={(e) => updateReward(index, { amount: Number(e.target.value) })}
                    />
                  </div>
                  <EggRewardEditor
                    value={reward.egg ?? defaultEggSpec()}
                    catalogs={catalogs.eggs}
                    onChange={(egg) => updateReward(index, { egg })}
                  />
                </div>
              )}

              <button
                type="button"
                className="retro-btn text-[0.72rem] ml-auto"
                onClick={() => removeReward(index)}
                title="Remove reward"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="retro-btn py-2 px-5" disabled={saving || !code.trim()}>
            <span className="flex items-center gap-1">
              <Save size={12} /> {editing ? 'Update code' : 'Create code'}
            </span>
          </button>
          {editing && (
            <button type="button" className="retro-btn text-[0.75rem]" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
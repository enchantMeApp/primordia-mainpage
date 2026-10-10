import { useEffect, useState } from 'react';
import { api } from '../api';
import type { PlayerSessionResponse, RecentPlayer } from '../types';
import { displayName, formatUptime } from '../format';

const SCREEN_LABELS: Record<string, string> = {
  home: 'Home',
  explore: 'Explore',
  party: 'Party',
  roster: 'Roster',
  inventory: 'Inventory',
  equipment: 'Equipment',
  crafting: 'Crafting',
  camp: 'Camp',
  arena: 'Arena',
  profile: 'Profile',
  skills: 'Skills',
  lore: 'Lore',
  bestiary: 'Bestiary',
  shop: 'Shop',
  employees: 'Employees',
  settings: 'Settings',
  onboarding: 'Onboarding',
  terminal: 'Helix Terminal',
  battle: 'Battle',
  dungeon: 'Dungeon',
  expedition: 'Expedition',
};

function screenLabel(screen: string | null): string {
  if (!screen) return '—';
  return SCREEN_LABELS[screen] ?? screen;
}

function formatClock(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
}

export function SessionDetail({
  player,
  onBack,
}: {
  player: RecentPlayer;
  onBack: () => void;
}) {
  const [data, setData] = useState<PlayerSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<PlayerSessionResponse>(`/api/admin/players/${player.userId}/session`)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [player.userId, tick]);

  const session = data?.session ?? null;
  const events = data?.events ?? [];

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">
          Session — {displayName(player)}
        </h2>
        <button type="button" className="retro-btn text-[0.75rem]" onClick={onBack}>
          ‹ Back to Last Online
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="retro-btn text-[0.75rem]"
          onClick={() => setTick((t) => t + 1)}
        >
          Refresh
        </button>
        {data && session && (
          <span className="admin-label">
            {session.id} · {events.length} actions listed
          </span>
        )}
      </div>

      {error && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {error}
        </div>
      )}

      {loading && <span className="text-[0.85rem] text-[#888888]">Loading session…</span>}

      {!loading && !error && !session && (
        <div className="retro-window px-3 py-6 text-center text-[0.85rem] text-[#888888]">
          No session data yet for this player — sessions are recorded once this
          server build is live and the migration has run.
        </div>
      )}

      {!loading && !error && session && (
        <>
          <div className="flex flex-col gap-2 text-[0.85rem]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="admin-label w-28">Duration</span>
              <span className="text-[#e8b830] admin-mono text-[1rem]">
                {formatUptime(session.durationMs)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="admin-label w-28">Status</span>
              {session.ongoing ? (
                <span className="text-[#7fd07f]">ongoing</span>
              ) : (
                <span className="text-[#888888]">ended</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="admin-label w-28">Ended on screen</span>
              <span className="text-[#b8d8f8] admin-mono">{screenLabel(session.endScreen)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="admin-label w-28">Session window</span>
              <span className="admin-mono text-[#c0c0c0]">
                {formatClock(session.startedAtMs)}
                {session.endedAtMs !== null
                  ? ` → ${formatClock(session.endedAtMs)}`
                  : ' → now'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <span className="admin-label w-28">Last activity</span>
              <span className="admin-mono text-[#c0c0c0]">{formatClock(session.lastActivityMs)}</span>
            </div>
          </div>

          <div className="retro-window">
            <table className="w-full border-collapse text-[0.85rem]">
              <thead>
                <tr className="text-left text-[#888888]">
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Time</th>
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Action</th>
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Detail</th>
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">On screen</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-[#888888]">
                      No actions recorded in this session yet.
                    </td>
                  </tr>
                )}
                {events.map((e) => (
                  <tr key={e.id} className="odd:bg-[#0a0a0a]">
                    <td className="px-3 py-2 border-b border-[#222222] admin-mono text-[#888888] whitespace-nowrap"
                      title={formatClock(e.createdAtMs)}>
                      {formatClock(e.createdAtMs)}
                    </td>
                    <td className="px-3 py-2 border-b border-[#222222]
                        ${e.action === 'screen' ? 'text-[#777777]' : 'text-[#c0c0c0]'}">
                      {e.action === 'screen' ? `Opened ${screenLabel(e.detail)}` : e.label}
                    </td>
                    <td className="px-3 py-2 border-b border-[#222222] text-[#888888]">
                      {e.detail || ''}
                    </td>
                    <td className="px-3 py-2 border-b border-[#222222] admin-mono text-[#888888]">
                      {e.screen ? screenLabel(e.screen) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { LastOnlineResponse, RecentPlayer } from '../types';
import { displayName, timeAgo } from '../format';
import { SessionDetail } from './SessionDetail';

export function RecentOnline() {
  const [data, setData] = useState<LastOnlineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<RecentPlayer | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<LastOnlineResponse>('/api/admin/players/recent')
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [tick]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 10_000);
    return () => window.clearInterval(id);
  }, []);

  if (selected) {
    return <SessionDetail player={selected} onBack={() => setSelected(null)} />;
  }

  const players = data?.players ?? [];
  const hours = Math.round((data?.windowMs ?? 0) / 3_600_000);
  const onlineNow = players.filter((p) => p.active).length;

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Last Online</h2>
        <button
          type="button"
          className="retro-btn text-[0.75rem]"
          onClick={() => setTick((t) => t + 1)}
        >
          Refresh
        </button>
        {data && (
          <span className="admin-label">
            {players.length} seen in {hours}h window · {onlineNow} currently active
          </span>
        )}
        <span className="admin-label text-[0.7rem] text-[#777777]">click a row for session detail</span>
      </div>

      {error && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {error}
        </div>
      )}

      <div className="retro-window">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr className="text-left text-[#888888]">
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Player</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Player Tag</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Level</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Location</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Last Seen</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Status</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333] w-6"></th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[#888888]">
                  No activity records yet — the server begins recording once this builds.
                </td>
              </tr>
            )}
            {players.map((p: RecentPlayer) => (
              <tr
                key={p.userId}
                className="odd:bg-[#0a0a0a] cursor-pointer hover:bg-[#141d2a]"
                onClick={() => setSelected(p)}
                title={`Session detail for ${displayName(p)}`}
              >
                <td className="px-3 py-2 border-b border-[#222222] text-[#c0c0c0]">
                  {displayName(p)}
                </td>
                <td className="px-3 py-2 border-b border-[#222222] text-[#b8d8f8] admin-mono">
                  {p.playerTag ?? <span className="text-[#555555]">—</span>}
                </td>
                <td className="px-3 py-2 border-b border-[#222222] text-right admin-mono">{p.level}</td>
                <td className="px-3 py-2 border-b border-[#222222] admin-mono text-[#888888]">
                  {p.location ?? 'camp'}
                </td>
                <td className="px-3 py-2 border-b border-[#222222] text-right" title={new Date(p.lastSeenMs).toISOString()}>
                  {timeAgo(p.lastSeenMs)}
                </td>
                <td className="px-3 py-2 border-b border-[#222222] text-right">
                  {p.active ? (
                    <span className="text-[#7fd07f]">online</span>
                  ) : (
                    <span className="text-[#666666]">offline</span>
                  )}
                </td>
                <td className="px-3 py-2 border-b border-[#222222] text-right admin-mono text-[#666666]">▸</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
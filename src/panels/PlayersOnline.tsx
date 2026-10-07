import { useEffect, useState } from 'react';
import { api } from '../api';
import type { OnlineUser, PlayersResponse } from '../types';
import { timeAgo } from '../format';

export function PlayersOnline() {
  const [data, setData] = useState<PlayersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .get<PlayersResponse>('/api/admin/players/online')
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

  // Live list — poll every 5s while this panel is the active one.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 5_000);
    return () => window.clearInterval(id);
  }, []);

  const connected = data?.connected ?? [];

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Players Online</h2>
        <button
          type="button"
          className="retro-btn text-[0.75rem]"
          onClick={() => setTick((t) => t + 1)}
        >
          Refresh
        </button>
        {data && (
          <span className="admin-label">
            {connected.length} connected · {data.activeCount} active &lt;90s
          </span>
        )}
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
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Operator</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Player Tag</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">User ID</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Tabs</th>
              <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Since</th>
            </tr>
          </thead>
          <tbody>
            {connected.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[#888888]">
                  {error ? '—' : 'No players currently connected.'}
                </td>
              </tr>
            )}
            {connected.map((u: OnlineUser) => (
              <tr key={`${u.userId}-${u.since}`} className="odd:bg-[#0a0a0a]">
                <td className="px-3 py-2 border-b border-[#222222] text-[#c0c0c0]">{u.displayName}</td>
                <td className="px-3 py-2 border-b border-[#222222] text-[#b8d8f8] admin-mono">
                  {u.playerTag ?? <span className="text-[#555555]">—</span>}
                </td>
                <td className="px-3 py-2 border-b border-[#222222] text-right admin-mono text-[#888888]">
                  {u.userId}
                </td>
                <td className="px-3 py-2 border-b border-[#222222] text-right">{u.sockets}</td>
                <td className="px-3 py-2 border-b border-[#222222] text-right" title={new Date(u.since).toISOString()}>
                  {timeAgo(u.since)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { AccountRow, AccountsResponse } from '../types';
import { displayName, formatUTC } from '../format';
import { Stat } from './Stat';
import { Bar } from './Bar';

export function Accounts() {
  const [data, setData] = useState<AccountsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    api
      .get<AccountsResponse>('/api/admin/accounts')
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

  const totals = data?.totals;
  const recent = data?.recent ?? [];
  const growth = data?.growth ?? [];
  const levels = data?.levels ?? [];
  const growthMax = growth.reduce((m, g) => Math.max(m, g.count), 0);
  const levelMax = levels.reduce((m, l) => Math.max(m, l.count), 0);

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Accounts</h2>
        <button
          type="button"
          className="retro-btn text-[0.75rem]"
          onClick={() => setTick((t) => t + 1)}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {error}
        </div>
      )}

      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total accounts" value={String(totals.total)} />
          <Stat label="New — 24h" value={String(totals.last24h)} tone={totals.last24h > 0 ? 'ok' : undefined} />
          <Stat label="New — 7d" value={String(totals.last7d)} tone={totals.last7d > 0 ? 'ok' : undefined} />
          <Stat label="New — 30d" value={String(totals.last30d)} />
          <Stat
            label="Verified emails"
            value={`${totals.verified} / ${totals.total}`}
            tone={totals.verified > 0 ? 'ok' : undefined}
          />
        </div>
      )}

      {data && (
        <>
          <div className="retro-window p-3 flex flex-col gap-2">
            <span className="admin-label">Signups — last 14 days</span>
            <div className="flex flex-col gap-1.5">
              {growth.length === 0 && (
                <span className="text-[0.75rem] text-[#888888]">No signups in this window.</span>
              )}
              {growth.map((g) => (
                <div key={g.day} className="flex items-center gap-3">
                  <span className="admin-mono text-[0.75rem] text-[#888888] w-20 shrink-0">{g.day}</span>
                  <div className="flex-1">
                    <Bar value={g.count} max={growthMax} color="#7fd07f" />
                  </div>
                  <span className="admin-mono text-[0.75rem] w-8 text-right">{g.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="retro-window">
            <div className="px-3 pt-3">
              <span className="admin-label">Newest accounts</span>
            </div>
            <table className="w-full border-collapse text-[0.85rem]">
              <thead>
                <tr className="text-left text-[#888888]">
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Player</th>
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Player Tag</th>
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Level</th>
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Location</th>
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Created</th>
                  <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Verified</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[#888888]">
                      No accounts yet.
                    </td>
                  </tr>
                )}
                {recent.map((a: AccountRow) => (
                  <tr key={a.userId} className="odd:bg-[#0a0a0a]">
                    <td className="px-3 py-2 border-b border-[#222222] text-[#c0c0c0]">
                      {displayName(a)}
                    </td>
                    <td className="px-3 py-2 border-b border-[#222222] text-[#b8d8f8] admin-mono">
                      {a.playerTag ?? <span className="text-[#555555]">—</span>}
                    </td>
                    <td className="px-3 py-2 border-b border-[#222222] text-right admin-mono">{a.level}</td>
                    <td className="px-3 py-2 border-b border-[#222222] admin-mono text-[#888888]">
                      {a.location ?? 'camp'}
                    </td>
                    <td className="px-3 py-2 border-b border-[#222222] text-right text-[#888888]">
                      {formatUTC(a.createdAt)}
                    </td>
                    <td className="px-3 py-2 border-b border-[#222222] text-right">
                      {a.verified ? (
                        <span className="text-[#7fd07f]">yes</span>
                      ) : (
                        <span className="text-[#888888]">no</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {levels.length > 0 && (
            <div className="retro-window p-3 flex flex-col gap-2">
              <span className="admin-label">Level distribution</span>
              <div className="flex flex-col gap-1.5">
                {levels.map((l) => (
                  <div key={l.level} className="flex items-center gap-3">
                    <span className="admin-mono text-[0.75rem] text-[#888888] w-8 shrink-0 text-right">
                      {l.level}
                    </span>
                    <div className="flex-1">
                      <Bar value={l.count} max={levelMax} />
                    </div>
                    <span className="admin-mono text-[0.75rem] w-8 text-right">{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
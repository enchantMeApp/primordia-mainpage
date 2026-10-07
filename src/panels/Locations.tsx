import { useEffect, useState } from 'react';
import { api } from '../api';
import type { LocationPlayer, LocationsResponse } from '../types';
import { displayName } from '../format';
import { Bar } from './Bar';

export function Locations() {
  const [data, setData] = useState<LocationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [players, setPlayers] = useState<LocationPlayer[] | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<LocationsResponse>('/api/admin/locations')
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
    if (selected === null) {
      setPlayers(null);
      setDetailError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setDetailError(null);
    api
      .get<{ players: LocationPlayer[] }>(`/api/admin/locations/players?location=${encodeURIComponent(selected)}`)
      .then((res) => {
        if (active) {
          setPlayers(res.players);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setDetailError(err.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selected]);

  const locations = data?.locations ?? [];
  const maxPlayers = locations.reduce((m, l) => Math.max(m, l.players), 0);

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Locations</h2>
        <button
          type="button"
          className="retro-btn text-[0.75rem]"
          onClick={() => setTick((t) => t + 1)}
        >
          Refresh
        </button>
        {data && (
          <span className="admin-label">
            {data.total} players across {locations.length} locations
          </span>
        )}
      </div>

      {error && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {error}
        </div>
      )}

      <div className="retro-window p-3 flex flex-col gap-2">
        {locations.length === 0 && (
          <span className="text-[0.85rem] text-[#888888]">No location data.</span>
        )}
        {locations.map((l) => (
          <div key={l.location} className="flex flex-col gap-1">
            <button
              type="button"
              className={`flex items-center gap-3 w-full text-left px-1 py-1 ${
                selected === l.location ? 'bg-[#1a1a1a]' : ''
              }`}
              onClick={() => setSelected((s) => (s === l.location ? null : l.location))}
            >
              <span className="admin-mono text-[0.8rem] text-[#b8d8f8] w-40 truncate shrink-0">
                {l.location}
              </span>
              <div className="flex-1">
                <Bar value={l.players} max={maxPlayers} />
              </div>
              <span className="admin-mono text-[0.8rem] w-8 text-right">{l.players}</span>
              <span className="admin-mono text-[0.75rem] text-[#888888] w-6 text-right shrink-0">
                {selected === l.location ? '▼' : '▸'}
              </span>
            </button>

            {selected === l.location && (
              <div className="ml-1 border-l-2 border-[#333333] pl-4">
                {loading && <span className="text-[0.75rem] text-[#888888]">Loading…</span>}
                {detailError && (
                  <span className="text-[0.75rem] text-[#ff7777]">{detailError}</span>
                )}
                {players && players.length === 0 && (
                  <span className="text-[0.75rem] text-[#888888]">No players here.</span>
                )}
                {players &&
                  players.map((p: LocationPlayer) => (
                    <div key={p.userId} className="flex items-center gap-3 py-0.5 text-[0.8rem]">
                      <span className="text-[#c0c0c0]">{displayName(p)}</span>
                      <span className="admin-mono text-[#b8d8f8]">
                        {p.playerTag ?? <span className="text-[#555555]">—</span>}
                      </span>
                      <span className="admin-mono text-[#888888] ml-auto">lv {p.level}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
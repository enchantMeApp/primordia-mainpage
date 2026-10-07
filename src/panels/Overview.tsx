import { useEffect, useState } from 'react';
import { api } from '../api';
import type { OverviewResponse } from '../types';
import { formatBytes, formatUptime } from '../format';
import { Stat } from './Stat';

function Err({ ok, error }: { ok: boolean; error?: string }) {
  return ok ? 'OK' : `DOWN — ${error ?? 'no reply'}`;
}

export function Overview() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<OverviewResponse>('/api/admin/overview')
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

  // Auto-refresh every 10s while the panel is open; it only fills slowly.
  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 10_000);
    return () => window.clearInterval(id);
  }, [auto]);

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center gap-3">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Server Overview</h2>
        <button
          type="button"
          className="retro-btn text-[0.75rem]"
          onClick={() => setTick((t) => t + 1)}
        >
          Refresh
        </button>
        <label className="flex items-center gap-2 text-[0.75rem] text-[#888888]">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
            className="accent-[#e8b830]"
          />
          auto 10s
        </label>
      </div>

      {error && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Uptime" value={formatUptime(data.uptimeMs)} />
            <Stat label="Process RSS" value={formatBytes(data.memory.rss)} />
            <Stat label="Node" value={data.node} />
            <Stat label="WS Clients" value={String(data.wsClients)} />
            <Stat label="Postgres" value={Err(data.db)} tone={data.db.ok ? 'ok' : 'bad'} />
            <Stat label="Redis" value={Err(data.redis)} tone={data.redis.ok ? 'ok' : 'bad'} />
            <Stat label="Connected" value={String(data.online.connected)} tone="ok" />
            <Stat
              label="Active <90s"
              value={String(data.online.active)}
              tone={data.online.active > 0 ? 'ok' : undefined}
            />
          </div>

          <div className="retro-panel-inset p-3 flex flex-col gap-1">
            <span className="admin-label">Stats Discord sink</span>
            <span className="admin-mono text-[0.85rem]">
              {data.stats.enabled
                ? `enabled — ${data.stats.bufferLength} buffered row${data.stats.bufferLength === 1 ? '' : 's'}`
                : 'disabled (DISCORD_STATS_WEBHOOK_URL empty)'}
            </span>
          </div>

          <details className="retro-panel-inset p-3">
            <summary className="admin-label cursor-pointer">Raw payload</summary>
            <pre className="mt-2 text-[0.68rem] leading-relaxed text-[#b8d8f8] overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../api';
import type { RestartResponse, StatusResponse } from '../types';
import { formatUptime } from '../format';

const ARMED_MS = 8_000;

export function RestartPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scheduled, setScheduled] = useState<RestartResponse | null>(null);
  const [restarting, setRestarting] = useState(false);
  const disarmTimer = useRef<number | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get<StatusResponse>('/api/admin/status');
      setStatus(res);
      setStatusError(null);
    } catch (err) {
      setStatus(null);
      setStatusError(err instanceof Error ? err.message : 'pm2 status unavailable');
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    return () => {
      if (disarmTimer.current !== null) window.clearTimeout(disarmTimer.current);
    };
  }, [loadStatus]);

  async function restart() {
    if (busy) return;
    if (!armed) {
      setArmed(true);
      disarmTimer.current = window.setTimeout(() => setArmed(false), ARMED_MS);
      return;
    }
    setBusy(true);
    setScheduled(null);
    setRestarting(true);
    try {
      const res = await api.post<RestartResponse>('/api/admin/restart');
      setScheduled(res);
      // The backend goes away and comes back; poll until pm2 answers again.
      pollAfterRestart();
    } catch (err) {
      setRestarting(false);
      setStatusError(err instanceof Error ? err.message : 'Restart request failed');
    } finally {
      setBusy(false);
      setArmed(false);
    }
  }

  function pollAfterRestart() {
    let attempts = 0;
    const id = window.setInterval(async () => {
      attempts += 1;
      try {
        const res = await api.get<StatusResponse>('/api/admin/status');
        setStatus(res);
        setStatusError(null);
        setRestarting(false);
        window.clearInterval(id);
      } catch {
        if (attempts >= 40) {
          setRestarting(false);
          setStatusError('Backend did not come back within 200s.');
          window.clearInterval(id);
        }
      }
    }, 5_000);
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Restart</h2>
        <button type="button" className="retro-btn text-[0.75rem]" onClick={() => void loadStatus()}>
          <span className="flex items-center gap-1">
            <RefreshCw size={12} /> Refresh
          </span>
        </button>
      </div>

      {scheduled && (
        <div className="border-2 border-[#4a7a9c] bg-[#0a1a2c] px-3 py-2 text-[0.85rem] text-[#b8d8f8]">
          Restart scheduled for {scheduled.target} — the game server will drop briefly.
        </div>
      )}
      {restarting && (
        <div className="border-2 border-[#4a7a9c] bg-[#0a1a2c] px-3 py-2 text-[0.85rem] text-[#b8d8f8]">
          Backend is restarting and polling for recovery…
        </div>
      )}
      {statusError && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {statusError}
        </div>
      )}

      {status && (
        <div className="retro-window">
          <table className="w-full border-collapse text-[0.85rem]">
            <thead>
              <tr className="text-left">
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Process</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">ID</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Status</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Uptime</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Restarts</th>
              </tr>
            </thead>
            <tbody>
              {status.processes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[#888888]">
                    pm2 is reachable but reports no processes.
                  </td>
                </tr>
              )}
              {status.processes.map((p) => (
                <tr key={p.id} className="odd:bg-[#0a0a0a]">
                  <td className="px-3 py-2 border-b border-[#222222] text-[#c0c0c0] admin-mono">{p.name}</td>
                  <td className="px-3 py-2 border-b border-[#222222] text-[#888888]">{p.id}</td>
                  <td
                    className="px-3 py-2 border-b border-[#222222] uppercase"
                    style={{ color: p.status === 'online' ? '#7fd07f' : '#ff7777' }}
                  >
                    {p.status}
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] text-right admin-mono">
                    {formatUptime(p.uptime)}
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] text-right">{p.restarts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="retro-window p-4 flex flex-col gap-3">
        <span className="admin-label">Danger zone</span>
        <p className="text-[0.8rem] leading-relaxed text-[#c0c0c0] max-w-2xl">
          Restarts every process pm2 manages on this daemon. Active players are
          disconnected, the stats buffer is flushed on shutdown, and the games
          server comes back within seconds. This is the only write action on the
          panel and it is logged to the audit trail.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`admin-danger py-2 px-5 ${armed ? '' : ''}`}
            style={armed ? { borderColor: '#ff5555' } : undefined}
            disabled={busy}
            onClick={() => void restart()}
          >
            {busy ? 'Restarting…' : armed ? 'Click again to CONFIRM' : `${status ? 'Restart' : '—'} pm2 daemon`}
          </button>
          {armed && (
            <span className="text-[0.7rem] text-[#e8b830]">
              Confirm within 8s, or click again after the timer resets the guard.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Megaphone, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../api';
import type {
  AdminAnnouncement,
  AdminAnnouncementsResponse,
  AnnouncementCreateResponse,
} from '../types';
import { formatUptime } from '../format';

const DEFAULT_COLOR = '#e8b830';
const MAX_TTL_MINUTES = 7 * 24 * 60;

export function AnnouncementsPanel() {
  const [data, setData] = useState<AdminAnnouncementsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [text, setText] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [minutes, setMinutes] = useState('30');

  // Ticks every second so the live TTL countdowns move.
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<AdminAnnouncementsResponse>('/api/admin/announcements');
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cleanText = text.trim();
    const minutesNum = Number(minutes);
    if (!cleanText) {
      setError('Announcement text is required.');
      return;
    }
    if (!Number.isFinite(minutesNum) || minutesNum <= 0) {
      setError('Duration must be a positive number of minutes.');
      return;
    }
    setError(null);
    try {
      await api.post<AnnouncementCreateResponse>('/api/admin/announcements', {
        text: cleanText,
        color,
        ttlMinutes: minutesNum,
      });
      setText('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post announcement');
    }
  }

  async function remove(id: string) {
    try {
      await api.del(`/api/admin/announcements/${encodeURIComponent(id)}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove announcement');
    }
  }

  function remainingLabel(item: AdminAnnouncement): string {
    if (item.expiresAt === null) return 'permanent';
    const ms = item.expiresAt - now;
    return ms > 0 ? formatUptime(ms) : 'expiring…';
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <div className="flex items-center gap-3">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Announcements</h2>
        <button type="button" className="retro-btn text-[0.75rem]" onClick={() => void load()}>
          <span className="flex items-center gap-1">
            <RefreshCw size={12} /> Refresh
          </span>
        </button>
        {loading && <span className="admin-label">loading…</span>}
      </div>

      <p className="text-[0.8rem] leading-relaxed text-[#c0c0c0] max-w-3xl">
        Rotating messages shown in the header bar of every game screen. Admin
        messages here are <span className="text-[#e8b830]">temporary</span> (they
        expire after the duration you set) and{' '}
        <span className="text-[#e8b830]">take priority</span> — they run before the
        permanent messages in <span className="admin-mono">announcements.json</span>.
        They appear for connected players instantly, no reload.
      </p>

      {error && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="retro-window p-4 flex flex-col gap-3">
        <span className="admin-label">Post a temporary announcement</span>
        <input
          className="retro-input px-3 py-2"
          placeholder="Message text (max 200 chars)"
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
        <div className="flex items-end gap-4 flex-wrap">
          <label className="flex flex-col gap-1">
            <span className="admin-label">Colour</span>
            <input
              type="color"
              aria-label="Announcement colour"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 bg-black border-2 border-[#333333] cursor-pointer"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="admin-label">Duration (minutes)</span>
            <input
              type="number"
              min={1}
              max={MAX_TTL_MINUTES}
              step={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="retro-input px-3 py-2 w-32"
            />
          </label>
          <button type="submit" className="retro-btn text-[0.8rem] py-2 px-5">
            <span className="flex items-center gap-2">
              <Megaphone size={14} /> Post
            </span>
          </button>
        </div>
        <span className="text-[0.68rem] text-[#777777]">
          Max {MAX_TTL_MINUTES} minutes (7 days). The message disappears on its own
          when the timer runs out.
        </span>
      </form>

      <div className="retro-window p-4 flex flex-col gap-3">
        <span className="admin-label">Active admin messages</span>
        {!data || data.admin.length === 0 ? (
          <p className="text-[0.8rem] text-[#888888]">None active.</p>
        ) : (
          <table className="w-full border-collapse text-[0.85rem]">
            <thead>
              <tr className="text-left">
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333]">Message</th>
                <th className="admin-label px-3 py-2 border-b-2 border-[#333333] text-right">Expires in</th>
                <th className="px-3 py-2 border-b-2 border-[#333333]" />
              </tr>
            </thead>
            <tbody>
              {data.admin.map((item) => (
                <tr key={item.id} className="odd:bg-[#0a0a0a]">
                  <td
                    className="px-3 py-2 border-b border-[#222222] break-words admin-mono"
                    style={{ color: item.color }}
                  >
                    {item.text}
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] text-right text-[#b8d8f8] admin-mono whitespace-nowrap">
                    {remainingLabel(item)}
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] text-right">
                    <button
                      type="button"
                      className="retro-btn text-[0.7rem] inline-flex items-center gap-1"
                      style={{ borderColor: '#aa3333' }}
                      onClick={() => void remove(item.id)}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="retro-window p-4 flex flex-col gap-3">
        <span className="admin-label">Permanent messages (announcements.json)</span>
        {!data || data.file.length === 0 ? (
          <p className="text-[0.8rem] text-[#888888]">
            No entries. Add an array of {'{'} id, text, color {'}'} to the root
            announcements.json and redeploy.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.file.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-[0.85rem] admin-mono">
                <span className="text-[#666666] text-[0.7rem]">#{item.id}</span>
                <span style={{ color: item.color }}>{item.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

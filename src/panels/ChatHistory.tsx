import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../api';
import type { ChatMessage, ChatPageResponse } from '../types';
import { formatUTC } from '../format';

const PAGE = 100;

export function ChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [qInput, setQInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load(reset: boolean, search: string) {
    if (reset) {
      setLoading(true);
      setMessages([]);
    } else {
      setLoadingOlder(true);
    }
    setError(null);

    const params = new URLSearchParams({ limit: String(PAGE) });
    if (!reset && nextBefore !== null) params.set('before', String(nextBefore));
    if (search) params.set('q', search);

    try {
      const res = await api.get<ChatPageResponse>(`/api/admin/chat?${params.toString()}`);
      setMessages((prev) => (reset ? res.messages : [...prev, ...res.messages]));
      setNextBefore(res.nextBefore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
      setLoadingOlder(false);
    }
  }

  useEffect(() => {
    void load(true, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the newest messages pinned to the bottom once known, like the game chat.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, loadingOlder]);

  function search(event: FormEvent) {
    event.preventDefault();
    setQ(qInput.trim());
    setNextBefore(null);
    void load(true, qInput.trim());
  }

  return (
    <div className="flex flex-col gap-4 max-w-6xl h-full">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="retro-titlebar px-8 py-2 !tracking-[4px]">Global Chat History</h2>
        <form className="flex items-center gap-2" onSubmit={search}>
          <input
            className="retro-input px-3 py-1.5 w-60"
            placeholder="Filter by message text…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            spellCheck={false}
          />
          <button type="submit" className="retro-btn text-[0.75rem]">
            Search
          </button>
          {q && (
            <button
              type="button"
              className="retro-btn text-[0.75rem]"
              onClick={() => {
                setQInput('');
                setQ('');
                setNextBefore(null);
                void load(true, '');
              }}
            >
              Clear
            </button>
          )}
        </form>
        <span className="admin-label">{messages.length} shown</span>
      </div>

      {error && (
        <div className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]">
          {error}
        </div>
      )}

      <div className="retro-window flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-[#888888]">Loading archive…</div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center text-[#888888]">
            {q ? 'No messages match that filter.' : 'No messages recorded yet.'}
          </div>
        ) : (
          <table className="w-full border-collapse text-[0.85rem]">
            <tbody>
              {messages.map((m: ChatMessage) => (
                <tr key={m.id} className="odd:bg-[#0a0a0a] align-top">
                  <td
                    className="px-3 py-2 border-b border-[#222222] whitespace-nowrap text-[#888888] admin-mono text-[0.7rem]"
                    title={formatUTC(m.created_at)}
                  >
                    {formatUTC(m.created_at)}
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] whitespace-nowrap text-[#b8d8f8]">
                    {m.user_login}
                    <span className="text-[#555555] text-[0.68rem] admin-mono"> #{m.user_id}</span>
                  </td>
                  <td className="px-3 py-2 border-b border-[#222222] whitespace-pre-wrap break-words text-[#c0c0c0]">
                    {m.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>

      <button
        type="button"
        className="retro-btn py-2"
        disabled={loading || loadingOlder || nextBefore === null}
        onClick={() => void load(false, q)}
      >
        {nextBefore === null ? 'No older messages' : loadingOlder ? 'Loading older…' : `Load older (before #${nextBefore})`}
      </button>
    </div>
  );
}
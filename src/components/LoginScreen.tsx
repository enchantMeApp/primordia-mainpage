import { useState, type FormEvent } from 'react';
import logoUrl from '../assets/main_page.png';
import { api, ApiError } from '../api';
import { setToken } from '../auth';
import type { LoginResponse } from '../types';

interface LoginScreenProps {
  onSuccess: (token: string) => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.post<LoginResponse>('/api/admin/login', { username, password });
      setToken(res.token);
      onSuccess(res.token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#000000]">
      <div className="retro-window w-full max-w-md">
        <div className="retro-titlebar flex items-center gap-3">
          <img src={logoUrl} alt="" className="h-8 w-auto" />
          <span>Admin Access</span>
        </div>

        <form className="p-6 flex flex-col gap-4" onSubmit={submit}>
          <div className="flex flex-col gap-1">
            <label className="admin-label" htmlFor="admin-user">
              Operator
            </label>
            <input
              id="admin-user"
              className="retro-input px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              spellCheck={false}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="admin-label" htmlFor="admin-pass">
              Passphrase
            </label>
            <input
              id="admin-pass"
              type="password"
              className="retro-input px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div
              className="border-2 border-[#aa3333] bg-[#1a0808] px-3 py-2 text-[0.85rem] text-[#ff9999]"
              role="alert"
            >
              {error}
            </div>
          )}

          <button type="submit" className="retro-btn py-3" disabled={busy}>
            {busy ? 'Authorising…' : 'Enter Console'}
          </button>

          <p className="text-[0.72rem] leading-relaxed text-[#888888]">
            Credentials are validated by the game backend. This console holds no
            game secrets of its own.
          </p>
        </form>
      </div>
    </div>
  );
}

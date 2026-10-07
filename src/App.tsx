import { useEffect, useState } from 'react';
import { api, UNAUTHORIZED_EVENT } from './api';
import { clearToken, getToken } from './auth';
import { LoginScreen } from './components/LoginScreen';
import { PanelShell } from './components/PanelShell';
import { PANELS } from './panels/PANELS';
import type { SessionResponse } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [operator, setOperator] = useState('OPERATOR');
  const [activeId, setActiveId] = useState(PANELS[0].id);

  // Any 401/403 from the admin API drops us back to login immediately.
  useEffect(() => {
    const onUnauthorized = () => {
      clearToken();
      setToken(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Validate the stored token once at boot; 401/403 self-handles via the event.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .get<SessionResponse>('/api/admin/session')
      .then((res) => {
        if (!cancelled) setOperator(res.user);
      })
      .catch(() => {
        /* network errors keep us logged in so a restarting backend doesn't log us out */
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return <LoginScreen onSuccess={(next) => setToken(next)} />;
  }

  const Active = PANELS.find((p) => p.id === activeId) ?? PANELS[0];

  return (
    <PanelShell
      panels={PANELS}
      activeId={activeId}
      onSelect={setActiveId}
      onLogout={() => {
        clearToken();
        setToken(null);
      }}
      user={operator}
    >
      <Active.Component />
    </PanelShell>
  );
}
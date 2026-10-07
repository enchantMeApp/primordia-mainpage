import { useEffect, useState, type ReactNode } from 'react';
import logoUrl from '../assets/main_page.png';
import type { PanelDef } from '../panels/PANELS';

interface PanelShellProps {
  panels: PanelDef[];
  activeId: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
  user: string;
  children: ReactNode;
}

export function PanelShell({
  panels,
  activeId,
  onSelect,
  onLogout,
  user,
  children,
}: PanelShellProps) {
  const [clock, setClock] = useState(() => new Date().toISOString().slice(11, 19));

  // A live clock in the titlebar keeps it obvious the page is not a stale tab.
  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#000000]">
      <div
        className="flex items-center justify-between px-1 py-0.5 border-b-[3px] border-[#333333] flex-shrink-0"
        style={{ background: 'var(--retro-primary)' }}
      >
        <div className="flex items-center h-full gap-3 ml-5">
          <img src={logoUrl} alt="Primordia" className="h-full max-h-12 w-auto" />
          <span
            className="text-[#e8f4ff] font-bold uppercase tracking-[4px] text-[1.05rem] border-l border-[#4a7a9c] pl-3"
          >
            Admin Console
          </span>
        </div>
        <div className="flex items-center gap-3 mr-4">
          <span className="admin-mono text-[0.8rem] text-[#888888]">{clock} UTC</span>
          <span className="admin-label border border-[#333333] px-2 py-0.5">{user}</span>
          <button type="button" className="retro-btn text-[0.75rem]" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <nav className="w-56 flex-shrink-0 border-r-[3px] border-[#333333] p-3 flex flex-col gap-2 bg-[#050505]">
          {panels.map((panel) => (
            <button
              key={panel.id}
              type="button"
              className={`retro-btn text-left w-full ${panel.id === activeId ? 'retro-btn-highlight' : ''}`}
              onClick={() => onSelect(panel.id)}
              title={panel.hint}
              style={panel.danger && panel.id !== activeId ? { borderColor: '#aa3333' } : undefined}
            >
              <span className="block leading-tight">{panel.label}</span>
              {panel.hint && (
                <span className="block text-[0.62rem] tracking-[1px] opacity-70 normal-case font-normal">
                  {panel.hint}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto admin-panel-inset retro-panel-inset p-2 text-[0.68rem] leading-relaxed text-[#888888]">
            Read-only unless marked. Every action is authorised server-side; this
            page is only a view.
          </div>
        </nav>

        <main className="flex-1 min-w-0 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}

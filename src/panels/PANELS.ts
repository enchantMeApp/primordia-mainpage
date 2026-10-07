import type { ComponentType } from 'react';
import { Overview } from './Overview';
import { PlayersOnline } from './PlayersOnline';
import { ChatHistory } from './ChatHistory';
import { RestartPanel } from './RestartPanel';

export interface PanelDef {
  id: string;
  label: string;
  hint?: string;
  danger?: boolean;
  Component: ComponentType;
}

// The extension point: add an entry here and it appears in the nav that same
// build. The backing route must be added server-side in admin.js too — every
// admin route is gated by requireAdmin there, never here.
export const PANELS: PanelDef[] = [
  { id: 'overview', label: 'Overview', hint: 'Server health & stats', Component: Overview },
  { id: 'players', label: 'Players Online', hint: 'Live connections', Component: PlayersOnline },
  { id: 'chat', label: 'Chat History', hint: 'Global channel archive', Component: ChatHistory },
  { id: 'restart', label: 'Restart', hint: 'Danger zone', danger: true, Component: RestartPanel },
];
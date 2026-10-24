import { useEffect, useMemo, useState } from 'react';
import { api, type RepopLocation, type RepopResponse } from '../api';
import { Stat } from './Stat';

const CATEGORIES = [
  { id: 'nodes', label: 'Nodes (Resources)' },
  { id: 'items', label: 'Items' },
  { id: 'encounters', label: 'Encounters (Creatures)' },
  { id: 'all', label: 'All' },
];

export function RepopulationPanel() {
  const [locations, setLocations] = useState<RepopLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Set<string>>(new Set(['all']));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ locations: RepopLocation[] }>('/api/admin/repop/locations');
        if (!cancelled) setLocations(res.locations || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load locations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, RepopLocation[]>();
    for (const loc of locations) {
      if (!map.has(loc.sectorName)) map.set(loc.sectorName, []);
      map.get(loc.sectorName)!.push(loc);
    }
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  }, [locations]);

  function toggle(loc: RepopLocation) {
    const key = loc.sectorKey + '|' + loc.locationKey;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelected(next);
  }

  function toggleCat(id: string) {
    const next = new Set(categories);
    if (id === 'all') {
      setCategories(new Set(['all']));
      return;
    }
    next.delete('all');
    if (next.has(id)) next.delete(id); else next.add(id);
    if (next.size === 0) next.add('all');
    setCategories(next);
  }

  function getCats() {
    if (categories.has('all')) return ['resources', 'items', 'creatures'];
    const out: string[] = [];
    if (categories.has('nodes')) out.push('resources');
    if (categories.has('items')) out.push('items');
    if (categories.has('encounters')) out.push('creatures');
    if (out.length === 0) return ['resources', 'items', 'creatures'];
    return out;
  }

  async function repopAll() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      await api.post<RepopResponse>('/api/admin/repop', { type: 'repop_all', categories: getCats() });
      setMsg('Repopulation queued for ALL locations on repopulation-worker');
    } catch (e: any) {
      setError(e?.message || 'Failed to queue repop');
    } finally {
      setBusy(false);
    }
  }

  async function repopSelected() {
    if (selected.size === 0) { setError('Select at least one location'); return; }
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const locs = Array.from(selected).map(k => {
        const [sectorKey, locationKey] = k.split('|');
        return { sectorKey, locationKey };
      });
      await api.post<RepopResponse>('/api/admin/repop', { type: 'repop_locations', locations: locs, categories: getCats() });
      setMsg(`Repopulation queued for ${locs.length} location(s)`);
    } catch (e: any) {
      setError(e?.message || 'Failed to queue repop');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Repopulation</div>
        <div className="panel-subtitle">Force repopulation via repopulation-worker (Redis)</div>
      </div>
      <div className="grid grid-3" style={{ marginBottom: 12 }}>
        <Stat label="Locations" value={locations.length.toString()} />
        <Stat label="Selected" value={selected.size.toString()} />
        <Stat label="Categories" value={categories.has('all') ? 'ALL' : Array.from(categories).join(',')} />
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">Repopulate</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} className={categories.has(c.id) ? 'btn primary' : 'btn'} onClick={() => toggleCat(c.id)} disabled={busy}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn danger" onClick={repopAll} disabled={busy}>REPOPULATE ALL LOCATIONS</button>
          <button className="btn" onClick={repopSelected} disabled={busy || selected.size === 0}>REPOPULATE SELECTED ({selected.size})</button>
        </div>
        {msg && <div style={{ color: '#4ade80', marginTop: 8 }}>{msg}</div>}
        {error && <div style={{ color: '#f87171', marginTop: 8 }}>{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">Locations</div>
        {loading && <div>Loading...</div>}
        {!loading && grouped.map(([sector, locs]) => (
          <div key={sector} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{sector}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 6 }}>
              {locs.map(loc => {
                const key = loc.sectorKey + '|' + loc.locationKey;
                const sel = selected.has(key);
                return (
                  <button key={key} className={sel ? 'btn primary' : 'btn'} onClick={() => toggle(loc)} style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                    {loc.name} <span style={{ opacity: 0.6, marginLeft: 6 }}>({loc.locationKey})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
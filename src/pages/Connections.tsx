import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Filter,
  GitBranch,
  Link2,
  Network,
  Search,
  Sigma,
  Sparkles,
  Waypoints,
  X,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, SectionTitle } from '@/components/ui';
import { TYPE_META } from '@/components/graph/KnowledgeNode';
import { computeMastery, forgettingRisk } from '@/lib/learning';
import { cn, fuzzyMatch, percent } from '@/lib/utils';
import type { EdgeType } from '@/types';

const EDGE_META: Record<EdgeType, { label: string; color: string }> = {
  prerequisite: { label: 'Prerequisite', color: '#36D6FF' },
  similarity: { label: 'Similarity', color: '#9166FF' },
  mathematical: { label: 'Mathematical', color: '#FFB86B' },
  application: { label: 'Application', color: '#4FD1C5' },
  extension: { label: 'Extension', color: '#B47BFF' },
  contrast: { label: 'Contrast', color: '#FF6B81' },
  'shared-principle': { label: 'Shared principle', color: '#5BE7A9' },
  historical: { label: 'Historical', color: '#8B97AD' },
  'cross-disciplinary': { label: 'Cross-disciplinary', color: '#FFD66B' },
  contains: { label: 'Contains', color: '#5A6782' },
};

export function Connections() {
  const universes = useApp((s) => s.universes);
  const nodes = useApp((s) => s.nodes);
  const edges = useApp((s) => s.edges);
  const progress = useApp((s) => s.progress);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const setActiveUniverse = useApp((s) => s.setActiveUniverse);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<EdgeType>>(new Set());
  const [scope, setScope] = useState<'universe' | 'all'>('universe');
  const [minConfidence, setMinConfidence] = useState(0);

  const universeId = activeUniverseId ?? universes[0]?.id;
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const scopedEdges = useMemo(() => {
    const base = scope === 'all' ? edges : edges.filter((e) => e.universeId === universeId);
    return base.filter((e) => e.type !== 'contains');
  }, [edges, scope, universeId]);

  const filtered = useMemo(() => {
    return scopedEdges.filter((e) => {
      if (typeFilter.size && !typeFilter.has(e.type)) return false;
      if (e.confidence < minConfidence) return false;
      if (!query.trim()) return true;
      const src = byId.get(e.source);
      const tgt = byId.get(e.target);
      return (
        fuzzyMatch(query, src?.title ?? '') ||
        fuzzyMatch(query, tgt?.title ?? '') ||
        fuzzyMatch(query, e.explanation)
      );
    });
  }, [scopedEdges, typeFilter, minConfidence, query, byId]);

  const typeCounts = useMemo(() => {
    const map = new Map<EdgeType, number>();
    for (const e of scopedEdges) map.set(e.type, (map.get(e.type) ?? 0) + 1);
    return map;
  }, [scopedEdges]);

  const hubs = useMemo(() => {
    const degree = new Map<string, number>();
    for (const e of scopedEdges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    }
    return [...degree.entries()]
      .map(([id, count]) => ({ node: byId.get(id), count }))
      .filter((x) => x.node)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [scopedEdges, byId]);

  const bridges = useMemo(() => {
    const universesOf = new Map<string, Set<string>>();
    for (const e of edges) {
      if (e.type === 'contains') continue;
      const src = byId.get(e.source);
      const tgt = byId.get(e.target);
      if (!src || !tgt || src.universeId === tgt.universeId) continue;
      for (const id of [e.source, e.target]) {
        const set = universesOf.get(id) ?? new Set<string>();
        set.add(e.universeId);
        universesOf.set(id, set);
      }
    }
    return edges
      .filter((e) => {
        const src = byId.get(e.source);
        const tgt = byId.get(e.target);
        return src && tgt && src.universeId !== tgt.universeId;
      })
      .slice(0, 10);
  }, [edges, byId]);

  const crossUniverse = useMemo(
    () =>
      edges.filter((e) => {
        const src = byId.get(e.source);
        const tgt = byId.get(e.target);
        return src && tgt && src.universeId !== tgt.universeId;
      }),
    [edges, byId],
  );

  const toggleType = (t: EdgeType) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-[1300px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Connection engine</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">How concepts relate</h1>
          <p className="mt-1 text-xs text-muted">
            {scopedEdges.length} semantic links across {scope === 'all' ? 'all universes' : 'this universe'} — each with a
            stated reason and confidence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'universe' | 'all')}
            className="h-8 rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2 text-[11px] outline-none"
          >
            <option value="universe">This universe</option>
            <option value="all">All universes</option>
          </select>
          {scope === 'all' && (
            <select
              value={universeId ?? ''}
              onChange={(e) => setActiveUniverse(e.target.value)}
              className="h-8 rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2 text-[11px] outline-none"
            >
              {universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/60 px-2.5">
            <Search size={12} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter connections"
              className="w-28 bg-transparent text-[11px] outline-none placeholder:text-muted sm:w-40"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted hover:text-ink" aria-label="Clear">
                <X size={10} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(Object.keys(EDGE_META) as EdgeType[])
          .filter((t) => t !== 'contains' && (typeCounts.get(t) ?? 0) > 0)
          .map((t) => {
            const active = typeFilter.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className="chip transition-colors"
                style={active ? { borderColor: EDGE_META[t].color, color: EDGE_META[t].color, background: `color-mix(in srgb, ${EDGE_META[t].color} 14%, transparent)` } : undefined}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: EDGE_META[t].color }} />
                {EDGE_META[t].label}
                <span className="font-mono text-[9px] opacity-60">{typeCounts.get(t)}</span>
              </button>
            );
          })}
        {typeFilter.size > 0 && (
          <button onClick={() => setTypeFilter(new Set())} className="chip">
            <X size={9} /> clear
          </button>
        )}
        <label className="ml-auto flex items-center gap-1.5 text-[10px] text-muted">
          <Filter size={10} /> min confidence {Math.round(minConfidence * 100)}%
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="w-20 accent-[var(--accent)]"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Network size={18} />}
              title="No connections match"
              description="Clear the filters, or add connections from a concept page."
            />
          ) : (
            filtered.slice(0, 120).map((e, i) => {
              const src = byId.get(e.source);
              const tgt = byId.get(e.target);
              if (!src || !tgt) return null;
              const meta = EDGE_META[e.type];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.012, 0.3) }}
                  className="panel px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link to={`/app/node/${src.id}`} className="text-[11.5px] font-medium hover:underline">
                      {src.title}
                    </Link>
                    <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}>
                      <ArrowRight size={8} /> {meta.label}
                    </span>
                    <Link to={`/app/node/${tgt.id}`} className="text-[11.5px] font-medium hover:underline">
                      {tgt.title}
                    </Link>
                    <span className="ml-auto flex shrink-0 items-center gap-1">
                      {e.custom && <Badge tone="ai">manual</Badge>}
                      <span className="font-mono text-[9px] text-muted">{Math.round(e.confidence * 100)}%</span>
                    </span>
                  </div>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{e.explanation}</p>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          <div className="panel p-3.5">
            <SectionTitle title="Hub concepts" hint="most connections" />
            {hubs.length === 0 ? (
              <p className="text-[10.5px] text-muted">No links in this scope.</p>
            ) : (
              <ul className="space-y-1.5">
                {hubs.map(({ node, count }) => {
                  if (!node) return null;
                  const p = progress[node.id];
                  return (
                    <li key={node.id}>
                      <Link to={`/app/node/${node.id}`} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-[var(--panel2)]/60">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TYPE_META[node.type]?.color }} />
                        <span className="min-w-0 flex-1 truncate text-[10.5px]">{node.title}</span>
                        <span className="shrink-0 font-mono text-[9.5px] text-muted">{count}</span>
                        <span className="w-8 shrink-0 text-right font-mono text-[9px]" style={{ color: p ? 'var(--mastery)' : 'var(--muted)' }}>
                          {p ? `${computeMastery(p)}%` : '—'}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="panel p-3.5">
            <SectionTitle title="Cross-universe bridges" hint={`${crossUniverse.length} links`} />
            {bridges.length === 0 ? (
              <p className="text-[10.5px] leading-relaxed text-muted">
                No bridges yet. Import a second universe that shares concepts, then link them manually from a concept page.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {bridges.map((e) => {
                  const src = byId.get(e.source);
                  const tgt = byId.get(e.target);
                  return (
                    <li key={e.id} className="text-[10px] leading-snug text-muted">
                      <span className="text-ink">{src?.title}</span> → <span className="text-ink">{tgt?.title}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="panel p-3.5">
            <SectionTitle title="Link quality" />
            <div className="space-y-2">
              {[
                ['High confidence (≥90%)', scopedEdges.filter((e) => e.confidence >= 0.9).length],
                ['Medium (70–89%)', scopedEdges.filter((e) => e.confidence >= 0.7 && e.confidence < 0.9).length],
                ['Low (<70%)', scopedEdges.filter((e) => e.confidence < 0.7).length],
                ['Manually added', scopedEdges.filter((e) => e.custom).length],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between text-[10.5px] text-muted">
                  <span>{String(label)}</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-3.5">
            <SectionTitle title="Orphan risk" hint="isolated concepts" />
            {(() => {
              const linked = new Set<string>();
              for (const e of scopedEdges) {
                linked.add(e.source);
                linked.add(e.target);
              }
              const orphans = nodes.filter((n) => n.universeId === universeId && n.type !== 'universe' && !linked.has(n.id));
              return orphans.length === 0 ? (
                <p className="flex items-center gap-1.5 text-[10.5px]" style={{ color: 'var(--mastery)' }}>
                  <CheckCircle2 size={10} /> Every concept has at least one semantic link.
                </p>
              ) : (
                <>
                  <p className="mb-1.5 text-[10px] text-muted">
                    {orphans.length} concept{orphans.length === 1 ? '' : 's'} with no semantic link (contains edges excluded).
                  </p>
                  <ul className="space-y-0.5">
                    {orphans.slice(0, 8).map((n) => (
                      <li key={n.id}>
                        <Link to={`/app/node/${n.id}`} className="flex items-center justify-between gap-1.5 rounded px-1.5 py-0.5 text-[10px] hover:bg-[var(--panel2)]/60">
                          <span className="truncate">{n.title}</span>
                          <Link2 size={9} className="shrink-0 text-muted" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              );
            })()}
          </div>

          <div className="panel p-3.5">
            <SectionTitle title="Weak-link alerts" hint="needs attention" />
            <ul className="space-y-1">
              {nodes
                .filter((n) => {
                  const p = progress[n.id];
                  return p && p.firstStudied && forgettingRisk(p) > 70;
                })
                .slice(0, 6)
                .map((n) => (
                  <li key={n.id}>
                    <Link to={`/app/node/${n.id}`} className="flex items-center justify-between gap-1.5 rounded px-1.5 py-0.5 text-[10px] hover:bg-[var(--panel2)]/60">
                      <span className="truncate">{n.title}</span>
                      <span className="shrink-0 font-mono" style={{ color: '#FFB86B' }}>
                        {progress[n.id] ? forgettingRisk(progress[n.id]) : 0}%
                      </span>
                    </Link>
                  </li>
                ))}
              {nodes.filter((n) => progress[n.id]?.firstStudied && forgettingRisk(progress[n.id]) > 70).length === 0 && (
                <p className="text-[10px] text-muted">No high-risk concepts. Revision is on schedule.</p>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { icon: GitBranch, label: 'Semantic edges', value: scopedEdges.length, hint: 'excluding hierarchy' },
          { icon: Waypoints, label: 'Concept coverage', value: `${percent(new Set(scopedEdges.flatMap((e) => [e.source, e.target])).size, Math.max(1, nodes.filter((n) => n.universeId === universeId).length))}%`, hint: 'nodes with a semantic link' },
          { icon: Activity, label: 'Manual links', value: scopedEdges.filter((e) => e.custom).length, hint: 'added by you' },
        ].map((s) => (
          <div key={s.label} className="panel flex items-center gap-3 p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
              <s.icon size={14} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">{s.value}</p>
              <p className="text-[10px] text-muted">
                {s.label} · {s.hint}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

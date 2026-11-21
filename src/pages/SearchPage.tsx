import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Filter, Route, Search, Sparkles, X } from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, Panel, SectionTitle } from '@/components/ui';
import { cn, percent, scoreMatch, timeAgo } from '@/lib/utils';
import type { NodeType } from '@/types';

const TYPES: NodeType[] = [
  'universe',
  'subject',
  'topic',
  'concept',
  'advanced',
  'formula',
  'example',
  'question',
  'application',
  'challenge',
];

interface Hit {
  id: string;
  kind: 'concept' | 'universe' | 'path';
  title: string;
  subtitle: string;
  to: string;
  score: number;
  universeId?: string;
  type?: NodeType;
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [kind, setKind] = useState<'all' | 'concept' | 'universe' | 'path'>('all');
  const [universeFilter, setUniverseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | NodeType>('all');

  const universes = useApp((s) => s.universes);
  const nodes = useApp((s) => s.nodes);
  const paths = useApp((s) => s.paths);
  const progress = useApp((s) => s.progress);
  const recentSearches = useApp((s) => s.recentSearches);
  const addRecentSearch = useApp((s) => s.addRecentSearch);
  const setActiveUniverse = useApp((s) => s.setActiveUniverse);
  const selectNode = useApp((s) => s.selectNode);

  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim();
    const out: Hit[] = [];

    for (const u of universes) {
      const base = q ? scoreMatch(q, u.name) : 20;
      const inDesc = q && u.description.toLowerCase().includes(q.toLowerCase()) ? 12 : 0;
      const inTags = q && u.tags.some((t) => t.toLowerCase().includes(q.toLowerCase())) ? 10 : 0;
      if (!q || base + inDesc + inTags > 0) {
        out.push({
          id: u.id,
          kind: 'universe',
          title: u.name,
          subtitle: u.description,
          to: '/app/universes',
          score: base + inDesc + inTags + 6,
          universeId: u.id,
        });
      }
    }

    for (const n of nodes) {
      if (universeFilter !== 'all' && n.universeId !== universeFilter) continue;
      if (typeFilter !== 'all' && n.type !== typeFilter) continue;

      let score = q ? scoreMatch(q, n.title) * 1.4 : 10;
      if (q) {
        const lq = q.toLowerCase();
        if (!score && n.summary.toLowerCase().includes(lq)) score = 34;
        if (!score && n.definitions.some((d) => d.term.toLowerCase().includes(lq))) score = 30;
        if (!score && n.formulas.some((f) => f.name.toLowerCase().includes(lq))) score = 28;
        if (!score && n.keyPrinciples.some((p) => p.toLowerCase().includes(lq))) score = 24;
        if (!score && n.theory.some((t) => t.body.toLowerCase().includes(lq))) score = 18;
      }
      if (score <= 0) continue;

      const p = progress[n.id];
      const mastery = p?.mastery ?? 0;
      out.push({
        id: n.id,
        kind: 'concept',
        title: n.title,
        subtitle: n.summary,
        to: `/app/node/${n.id}`,
        score: score + (mastery > 0 ? 4 : 0),
        universeId: n.universeId,
        type: n.type,
      });
    }

    for (const p of paths) {
      if (universeFilter !== 'all' && p.universeId !== universeFilter) continue;
      const score = q ? scoreMatch(q, p.title) + (scoreMatch(q, p.goal) > 0 ? 10 : 0) : 8;
      if (score <= 0) continue;
      out.push({
        id: p.id,
        kind: 'path',
        title: p.title,
        subtitle: p.goal,
        to: '/app/paths',
        score,
        universeId: p.universeId,
      });
    }

    return out
      .filter((h) => (kind === 'all' ? true : h.kind === kind))
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);
  }, [query, universes, nodes, paths, progress, kind, universeFilter, typeFilter]);

  const submit = (value: string) => {
    setQuery(value);
    addRecentSearch(value);
    setParams(value ? { q: value } : {});
  };

  const open = (hit: Hit) => {
    if (hit.universeId) setActiveUniverse(hit.universeId);
    if (hit.kind === 'concept') selectNode(hit.id);
    if (query.trim()) addRecentSearch(query);
    navigate(hit.to);
  };

  const grouped = useMemo(() => {
    return {
      concept: hits.filter((h) => h.kind === 'concept'),
      universe: hits.filter((h) => h.kind === 'universe'),
      path: hits.filter((h) => h.kind === 'path'),
    };
  }, [hits]);

  const activeUniverseName = universes.find((u) => u.id === universeFilter)?.name;

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Global search</p>
        <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">Find anything in your map</h1>
      </div>

      <Panel className="p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(query);
          }}
          className="flex items-center gap-2"
        >
          <Search size={16} className="shrink-0 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search concepts, formulas, definitions, universes, paths..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            aria-label="Search query"
          />
          {query && (
            <button
              type="button"
              onClick={() => submit('')}
              className="btn btn-ghost h-7 w-7 !px-0"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
          <button type="submit" className="btn btn-primary h-7 text-[11px]">
            Search
          </button>
        </form>

        {recentSearches.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--line)] pt-3">
            <span className="text-[10px] uppercase tracking-widest text-muted">Recent</span>
            {recentSearches.map((r) => (
              <button key={r} onClick={() => submit(r)} className="chip">
                {r}
              </button>
            ))}
          </div>
        )}
      </Panel>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Filter size={12} className="text-muted" />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="input h-7 !py-0 text-[11px]"
          aria-label="Filter by kind"
        >
          <option value="all">All kinds</option>
          <option value="concept">Concepts</option>
          <option value="universe">Universes</option>
          <option value="path">Paths</option>
        </select>
        <select
          value={universeFilter}
          onChange={(e) => setUniverseFilter(e.target.value)}
          className="input h-7 !py-0 text-[11px]"
          aria-label="Filter by universe"
        >
          <option value="all">All universes</option>
          {universes.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="input h-7 !py-0 text-[11px]"
          aria-label="Filter by node type"
        >
          <option value="all">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <span className="font-mono text-[10px] text-muted">{hits.length} results</span>
      </div>

      <div className="mt-4">
        {hits.length === 0 ? (
          <EmptyState
            icon={<Search size={18} />}
            title="Nothing matched"
            description={
              query
                ? `No concepts, universes or paths matched "${query}". Try a shorter or broader term.`
                : 'Type a term above to search across every concept, formula and definition in your map.'
            }
            action={
              recentSearches.length > 0 ? (
                <button onClick={() => submit(recentSearches[0])} className="btn btn-ghost">
                  Try "{recentSearches[0]}"
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {grouped.concept.length > 0 && (
              <Panel className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
                  <SectionTitle title="Concepts" hint={activeUniverseName ? `in ${activeUniverseName}` : 'across all universes'} className="!mb-0" />
                  <Badge tone="accent">{grouped.concept.length}</Badge>
                </div>
                <ul className="divide-y divide-[var(--line)]">
                  {grouped.concept.map((h, i) => {
                    const node = nodes.find((n) => n.id === h.id);
                    const p = progress[h.id];
                    return (
                      <li key={h.id}>
                        <motion.button
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.015, 0.2) }}
                          onClick={() => open(h)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--panel2)]/60"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-xs font-medium">{h.title}</span>
                              {h.type && <Badge tone="neutral">{h.type}</Badge>}
                              {node && <Badge tone="neutral">{node.difficulty}</Badge>}
                              {p?.status === 'mastered' && <Badge tone="mastery">mastered</Badge>}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted">{h.subtitle}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block font-mono text-[10px] text-muted">{percent(p?.mastery ?? 0, 100)}%</span>
                            {p?.lastStudied && <span className="block text-[10px] text-muted">{timeAgo(p.lastStudied)}</span>}
                          </span>
                          <ArrowRight size={12} className="mt-1 shrink-0 text-muted/50" />
                        </motion.button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}

            {grouped.universe.length > 0 && (
              <Panel className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
                  <SectionTitle title="Universes" className="!mb-0" />
                  <Badge tone="ai">{grouped.universe.length}</Badge>
                </div>
                <ul className="divide-y divide-[var(--line)]">
                  {grouped.universe.map((h) => {
                    const u = universes.find((x) => x.id === h.id);
                    const un = nodes.filter((n) => n.universeId === h.id);
                    const explored = un.filter((n) => progress[n.id]?.firstStudied).length;
                    return (
                      <li key={h.id}>
                        <button onClick={() => open(h)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--panel2)]/60">
                          <Compass size={14} className="shrink-0" style={{ color: u?.color ?? 'var(--ai)' }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium">{h.title}</span>
                            <span className="block truncate text-[11px] text-muted">{h.subtitle}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-muted">
                            {explored}/{un.length}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}

            {grouped.path.length > 0 && (
              <Panel className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
                  <SectionTitle title="Learning paths" className="!mb-0" />
                  <Badge tone="mastery">{grouped.path.length}</Badge>
                </div>
                <ul className="divide-y divide-[var(--line)]">
                  {grouped.path.map((h) => {
                    const p = paths.find((x) => x.id === h.id);
                    const done = p ? p.steps.filter((s) => s.completed).length : 0;
                    return (
                      <li key={h.id}>
                        <button onClick={() => open(h)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--panel2)]/60">
                          <Route size={14} className="shrink-0 text-[var(--mastery)]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium">{h.title}</span>
                            <span className="block truncate text-[11px] text-muted">{h.subtitle}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-muted">
                            {done}/{p?.steps.length ?? 0}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}
          </div>
        )}
      </div>

      {!query && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Panel className="p-4">
            <SectionTitle title="Search tips" hint="faster than scrolling the graph" />
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted">
              <li>Search by concept title, formula name, or a phrase from the theory.</li>
              <li>Definitions and key principles are indexed, not just titles.</li>
              <li>Filter by universe to search inside a single subject.</li>
              <li>Press <span className="kbd">Ctrl K</span> anywhere in the app for the quick palette.</li>
            </ul>
          </Panel>
          <Panel className="p-4">
            <SectionTitle title="Jump back in" hint="most recently studied" />
            <ul className="space-y-1">
              {nodes
                .filter((n) => progress[n.id]?.lastStudied)
                .sort((a, b) => (progress[b.id]?.lastStudied ?? '').localeCompare(progress[a.id]?.lastStudied ?? ''))
                .slice(0, 5)
                .map((n) => (
                  <li key={n.id}>
                    <Link
                      to={`/app/node/${n.id}`}
                      className={cn('flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-[var(--panel2)]/70')}
                    >
                      <span className="truncate">{n.title}</span>
                      <span className="shrink-0 text-[10px] text-muted">{timeAgo(progress[n.id]?.lastStudied)}</span>
                    </Link>
                  </li>
                ))}
              {nodes.filter((n) => progress[n.id]?.lastStudied).length === 0 && (
                <li className="flex items-center gap-2 py-3 text-[11px] text-muted">
                  <Sparkles size={12} /> Nothing studied yet — open a concept to begin.
                </li>
              )}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
}

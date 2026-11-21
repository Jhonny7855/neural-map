import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import { useApp } from '@/store/app';
import { cn, scoreMatch } from '@/lib/utils';
import { Badge } from '@/components/ui';

interface Result {
  id: string;
  title: string;
  subtitle: string;
  to: string;
  kind: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const universes = useApp((s) => s.universes);
  const nodes = useApp((s) => s.nodes);
  const paths = useApp((s) => s.paths);
  const recentSearches = useApp((s) => s.recentSearches);
  const addRecentSearch = useApp((s) => s.addRecentSearch);
  const setActiveUniverse = useApp((s) => s.setActiveUniverse);
  const selectNode = useApp((s) => s.selectNode);

  const results = useMemo<Result[]>(() => {
    const q = query.trim();
    const base: Result[] = [];
    if (!q) {
      const recentNodes = nodes.slice(0, 5);
      for (const n of recentNodes) {
        base.push({ id: n.id, title: n.title, subtitle: `${n.type} · ${n.difficulty}`, to: `/app/node/${n.id}`, kind: 'concept' });
      }
      return base;
    }

    const scored: { score: number; result: Result }[] = [];

    for (const u of universes) {
      const score = scoreMatch(q, u.name) + (u.description.toLowerCase().includes(q.toLowerCase()) ? 12 : 0);
      if (score > 0)
        scored.push({
          score: score + 8,
          result: { id: u.id, title: u.name, subtitle: u.description.slice(0, 70), to: '/app/universes', kind: 'universe' },
        });
    }

    for (const n of nodes) {
      let score = scoreMatch(q, n.title);
      if (!score && n.summary.toLowerCase().includes(q.toLowerCase())) score = 30;
      if (!score && n.definitions.some((d) => d.term.toLowerCase().includes(q.toLowerCase()))) score = 26;
      if (!score && n.formulas.some((f) => f.name.toLowerCase().includes(q.toLowerCase()))) score = 24;
      if (score > 0)
        scored.push({
          score,
          result: { id: n.id, title: n.title, subtitle: n.summary.slice(0, 78), to: `/app/node/${n.id}`, kind: n.type },
        });
    }

    for (const p of paths) {
      const score = scoreMatch(q, p.title);
      if (score > 0) scored.push({ score: score - 5, result: { id: p.id, title: p.title, subtitle: p.goal, to: '/app/paths', kind: 'path' } });
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((x) => x.result);
  }, [query, universes, nodes, paths]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  const go = (result: Result) => {
    const node = nodes.find((n) => n.id === result.id);
    if (node) {
      if (node.universeId) setActiveUniverse(node.universeId);
      selectNode(node.id);
      navigate(`/app/node/${node.id}`);
    } else {
      navigate(result.to);
    }
    if (query.trim()) addRecentSearch(query);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault();
      go(results[cursor]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-panel"
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-3">
              <Search size={15} className="text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search concepts, universes, formulas..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                aria-label="Search query"
              />
              <span className="kbd">ESC</span>
            </div>

            {!query && recentSearches.length > 0 && (
              <div className="border-b border-[var(--line)] px-3 py-2">
                <p className="px-1 pb-1 text-[10px] uppercase tracking-widest text-muted/70">Recent</p>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((r) => (
                    <button key={r} onClick={() => setQuery(r)} className="chip hover:text-ink">
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-[46vh] overflow-y-auto py-1">
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted">
                  No matches for "{query}". Try a concept name such as "gradient descent".
                </p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.kind}-${r.id}`}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(r)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      i === cursor ? 'bg-[var(--panel2)]' : 'hover:bg-[var(--panel2)]/60',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium">{r.title}</span>
                        <Badge tone={r.kind === 'universe' ? 'ai' : r.kind === 'path' ? 'mastery' : 'neutral'}>{r.kind}</Badge>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted">{r.subtitle}</span>
                    </span>
                    {i === cursor ? <CornerDownLeft size={12} className="shrink-0 text-muted" /> : <ArrowRight size={12} className="shrink-0 text-muted/40" />}
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2 text-[10px] text-muted">
              <span className="flex items-center gap-2">
                <span className="kbd">↑↓</span> navigate <span className="kbd">↵</span> open
              </span>
              <span>{results.length} result{results.length === 1 ? '' : 's'}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  Clock,
  RefreshCw,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, ProgressBar, SectionTitle, Tabs } from '@/components/ui';
import { computeMastery, forgettingRisk, isDue, isOverdue, scheduleRevision } from '@/lib/learning';
import { cn, timeAgo } from '@/lib/utils';
import type { NodeProgress } from '@/types';

type Bucket = 'overdue' | 'today' | 'week' | 'unscheduled';

export function RevisionCenter() {
  const nodes = useApp((s) => s.nodes);
  const progress = useApp((s) => s.progress);
  const runRevision = useApp((s) => s.runRevision);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const toast = useApp((s) => s.toast);

  const [bucket, setBucket] = useState<Bucket>('today');
  const [session, setSession] = useState<string[] | null>(null);
  const [cursor, setCursor] = useState(0);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const studied = useMemo(() => Object.values(progress).filter((p) => p.firstStudied), [progress]);

  const buckets = useMemo(() => {
    const overdue = studied.filter((p) => isOverdue(p));
    const today = studied.filter((p) => isDue(p) && !isOverdue(p));
    const week = studied.filter((p) => {
      if (!p.revisionDue) return false;
      const due = new Date(p.revisionDue).getTime();
      return due > Date.now() + 86_400_000 && due < Date.now() + 7 * 86_400_000;
    });
    const unscheduled = studied.filter((p) => !p.revisionDue);
    return { overdue, today, week, unscheduled };
  }, [studied]);

  const active = buckets[bucket];
  const sortedActive = useMemo(
    () =>
      [...active].sort((a, b) => {
        if (bucket === 'unscheduled') return forgettingRisk(b) - forgettingRisk(a);
        return (a.revisionDue ?? '').localeCompare(b.revisionDue ?? '');
      }),
    [active, bucket],
  );

  const startSession = () => {
    const ids = sortedActive.slice(0, 12).map((p) => p.nodeId);
    if (ids.length === 0) {
      toast({ title: 'Nothing to revise', description: 'This bucket is empty.', tone: 'info' });
      return;
    }
    setSession(ids);
    setCursor(0);
  };

  const gradeCurrent = (quality: number) => {
    if (!session) return;
    const nodeId = session[cursor];
    runRevision(nodeId, quality);
    if (cursor + 1 >= session.length) {
      toast({ title: 'Revision session complete', description: `${session.length} concepts reviewed.`, tone: 'success' });
      setSession(null);
      setCursor(0);
    } else {
      setCursor((c) => c + 1);
    }
  };

  const sessionNode = session ? byId.get(session[cursor]) : null;
  const sessionProgress = sessionNode ? progress[sessionNode.id] : null;

  const stats = [
    { label: 'Overdue', value: buckets.overdue.length, tone: 'danger' as const },
    { label: 'Due today', value: buckets.today.length, tone: 'warn' as const },
    { label: 'This week', value: buckets.week.length, tone: 'accent' as const },
    { label: 'Unscheduled', value: buckets.unscheduled.length, tone: 'neutral' as const },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Revision center</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">Beat the forgetting curve</h1>
          <p className="mt-1 text-xs text-muted">
            {settings.revisionAlgorithm === 'sm2' ? 'SM-2 scheduling' : 'Simple interval scheduling'} ·{' '}
            {studied.length} concepts in rotation
          </p>
        </div>
        <button onClick={startSession} disabled={sortedActive.length === 0} className="btn btn-primary h-8 text-[11px]">
          <RefreshCw size={12} /> Start revision session
        </button>
      </div>

      {session && sessionNode ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
              <span className="font-mono text-[11px] text-muted">
                {cursor + 1}/{session.length}
              </span>
              <button onClick={() => setSession(null)} className="btn btn-ghost h-6 !px-2 text-[10px]">
                <X size={10} /> End session
              </button>
            </div>

            <div className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted">Recall this concept</p>
              <h2 className="mt-1 font-display text-lg font-semibold">{sessionNode.title}</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{sessionNode.summary}</p>

              {sessionProgress && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    ['Mastery', `${computeMastery(sessionProgress)}%`],
                    ['Risk', `${forgettingRisk(sessionProgress)}%`],
                    ['Revisions', String(sessionProgress.revisionCount)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-[var(--line)] bg-[var(--panel2)]/40 p-2 text-center">
                      <p className="font-mono text-[12px]">{value}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-3">
                <p className="mb-2 text-[10.5px] text-muted">
                  Rate how well you recalled it <em>without</em> looking at the notes. Be honest — the schedule depends on it.
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                  {[
                    [1, 'Blank', 'danger'],
                    [2, 'Vague', 'warn'],
                    [3, 'Partial', 'accent'],
                    [4, 'Solid', 'mastery'],
                    [5, 'Perfect', 'mastery'],
                  ].map(([q, label, tone]) => (
                    <button
                      key={String(q)}
                      onClick={() => gradeCurrent(Number(q))}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-[10.5px] font-medium transition-colors',
                        tone === 'danger' && 'border-[rgba(255,107,129,0.4)] text-[#FF8A9B] hover:bg-[rgba(255,107,129,0.12)]',
                        tone === 'warn' && 'border-[rgba(255,184,107,0.4)] text-[#FFB86B] hover:bg-[rgba(255,184,107,0.12)]',
                        tone === 'accent' && 'border-[var(--line)] text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]',
                        tone === 'mastery' && 'border-[rgba(91,231,169,0.4)] text-[var(--mastery)] hover:bg-[rgba(91,231,169,0.12)]',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Link to={`/app/node/${sessionNode.id}`} className="text-[10.5px] text-[var(--accent)] hover:underline">
                  Open full concept →
                </Link>
                <button
                  onClick={() => {
                    if (cursor + 1 >= session.length) {
                      setSession(null);
                      setCursor(0);
                    } else setCursor((c) => c + 1);
                  }}
                  className="btn btn-ghost h-6 !px-2 text-[10px]"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>

          <div className="panel h-fit p-3">
            <p className="label mb-2">Session</p>
            <ul className="space-y-1">
              {session.map((id, i) => {
                const n = byId.get(id);
                return (
                  <li
                    key={id}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px]',
                      i === cursor ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-ink' : i < cursor ? 'text-muted/50' : 'text-muted',
                    )}
                  >
                    <span className="w-3 shrink-0 font-mono text-[9px]">{i + 1}</span>
                    <span className={cn('min-w-0 flex-1 truncate', i < cursor && 'line-through')}>{n?.title}</span>
                    {i < cursor && <Check size={9} style={{ color: 'var(--mastery)' }} />}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setBucket(s.label === 'Overdue' ? 'overdue' : s.label === 'Due today' ? 'today' : s.label === 'This week' ? 'week' : 'unscheduled')}
                  className={cn(
                    'panel p-3 text-left transition-colors',
                    (bucket === 'overdue' && s.label === 'Overdue') ||
                      (bucket === 'today' && s.label === 'Due today') ||
                      (bucket === 'week' && s.label === 'This week') ||
                      (bucket === 'unscheduled' && s.label === 'Unscheduled')
                      ? 'border-[color-mix(in_srgb,var(--accent)_50%,var(--line))]'
                      : '',
                  )}
                >
                  <p className="label">{s.label}</p>
                  <p
                    className="mt-1 font-display text-xl font-semibold"
                    style={{ color: s.tone === 'danger' ? '#FF6B81' : s.tone === 'warn' ? '#FFB86B' : s.tone === 'accent' ? 'var(--accent)' : 'var(--muted)' }}
                  >
                    {s.value}
                  </p>
                </button>
              ))}
            </div>

            <div className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
                <h3 className="text-[12px] font-semibold capitalize">{bucket} queue</h3>
                <span className="text-[10px] text-muted">{sortedActive.length} concepts</span>
              </div>

              {sortedActive.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={<BookOpenCheck size={16} />}
                    title="This queue is empty"
                    description={
                      bucket === 'overdue'
                        ? 'Nothing is overdue. Your schedule is on track.'
                        : bucket === 'today'
                          ? 'Nothing is due today. Study a new concept to add it to the rotation.'
                          : bucket === 'week'
                            ? 'Nothing scheduled this week yet.'
                            : 'Every studied concept has a schedule.'
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {sortedActive.map((p) => {
                    const node = byId.get(p.nodeId);
                    if (!node) return null;
                    const overdue = isOverdue(p);
                    const risk = forgettingRisk(p);
                    return (
                      <li key={p.nodeId} className="flex items-center gap-2 px-3 py-2">
                        <button
                          onClick={() => {
                            runRevision(p.nodeId, 4);
                            toast({ title: 'Marked reviewed', description: node.title, tone: 'success' });
                          }}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-[var(--mastery)]"
                          style={{ borderColor: 'var(--line)' }}
                          aria-label="Mark reviewed"
                        >
                          <Check size={10} className="text-muted" />
                        </button>
                        <Link to={`/app/node/${node.id}`} className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px]">{node.title}</span>
                          <span className="block text-[9.5px] text-muted">
                            mastery {computeMastery(p)}% · interval {p.intervalDays}d · {p.revisionCount} revisions
                          </span>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="w-16 text-right text-[9.5px]" style={{ color: overdue ? '#FF6B81' : risk > 60 ? '#FFB86B' : 'var(--muted)' }}>
                            {p.revisionDue ? (overdue ? 'overdue' : timeAgo(p.revisionDue)) : 'unscheduled'}
                          </span>
                          <button
                            onClick={() => {
                              runRevision(p.nodeId, 3);
                              toast({ title: 'Logged partial recall', tone: 'info' });
                            }}
                            className="btn btn-ghost h-6 !px-1.5 text-[9.5px]"
                          >
                            Review
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="panel p-3.5">
              <SectionTitle title="Scheduler" hint="how intervals grow" />
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-[11px] text-muted">
                  <span>Algorithm</span>
                  <select
                    value={settings.revisionAlgorithm}
                    onChange={(e) => updateSettings({ revisionAlgorithm: e.target.value as 'sm2' | 'simple' })}
                    className="rounded border border-[var(--line)] bg-[var(--panel2)] px-1.5 py-0.5 text-[10.5px] outline-none"
                  >
                    <option value="sm2">SM-2</option>
                    <option value="simple">Simple</option>
                  </select>
                </label>
                <p className="text-[10px] leading-relaxed text-muted">
                  {settings.revisionAlgorithm === 'sm2'
                    ? 'SM-2 multiplies the interval by an ease factor that adapts to your recall quality. A failed recall resets to one day.'
                    : 'Simple scheduling uses fixed doubling intervals regardless of recall quality.'}
                </p>
              </div>

              <div className="mt-3 space-y-1 border-t border-[var(--line)] pt-2.5 text-[10px] text-muted">
                {[
                  ['1st review', '1 day'],
                  ['2nd review', '3 days'],
                  ['3rd review', '× ease (~7 days)'],
                  ['Failed recall', 'reset to 1 day'],
                ].map(([k, v]) => (
                  <p key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="font-mono text-ink">{v}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="panel p-3.5">
              <SectionTitle title="Highest risk" hint="study these first" />
              {studied.length === 0 ? (
                <p className="text-[10.5px] text-muted">Nothing studied yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {[...studied]
                    .sort((a, b) => forgettingRisk(b) - forgettingRisk(a))
                    .slice(0, 6)
                    .map((p) => {
                      const node = byId.get(p.nodeId);
                      if (!node) return null;
                      const risk = forgettingRisk(p);
                      return (
                        <li key={p.nodeId}>
                          <Link to={`/app/node/${node.id}`} className="block rounded px-1.5 py-1 hover:bg-[var(--panel2)]/60">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="truncate text-[10.5px]">{node.title}</span>
                              <span className="shrink-0 font-mono text-[9.5px]" style={{ color: risk > 70 ? '#FF6B81' : risk > 50 ? '#FFB86B' : 'var(--muted)' }}>
                                {risk}%
                              </span>
                            </div>
                            <ProgressBar value={risk} height={2} tone={risk > 70 ? 'warn' : 'accent'} className="mt-1" />
                          </Link>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>

            <div className="panel p-3.5">
              <SectionTitle title="Why spaced repetition works" />
              <p className="text-[10.5px] leading-relaxed text-muted">
                Each successful retrieval at increasing intervals strengthens the memory trace more than massed practice.
                The forgetting curve flattens with every review — which is why a concept you review three times at widening
                gaps survives far longer than one you reread five times in a row.
              </p>
              <Link to="/app/analytics" className="btn btn-ghost mt-2.5 h-7 w-full text-[10px]">
                <Target size={10} /> See retention analytics
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

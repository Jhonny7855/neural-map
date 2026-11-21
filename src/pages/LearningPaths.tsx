import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  BookOpenCheck,
  Check,
  ChevronRight,
  Clock,
  Plus,
  Route as RouteIcon,
  SkipForward,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, Modal, ProgressBar, SectionTitle, useConfirm } from '@/components/ui';
import { computeMastery } from '@/lib/learning';
import { cn, formatMinutes, percent } from '@/lib/utils';
import type { Difficulty, KnowledgeNode } from '@/types';

export function LearningPaths() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const universes = useApp((s) => s.universes);
  const nodes = useApp((s) => s.nodes);
  const paths = useApp((s) => s.paths);
  const progress = useApp((s) => s.progress);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const createPath = useApp((s) => s.createPath);
  const deletePath = useApp((s) => s.deletePath);
  const updatePath = useApp((s) => s.updatePath);
  const togglePathStep = useApp((s) => s.togglePathStep);
  const skipPathStep = useApp((s) => s.skipPathStep);
  const reorderPathSteps = useApp((s) => s.reorderPathSteps);
  const toast = useApp((s) => s.toast);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(paths[0]?.id ?? null);
  const [form, setForm] = useState({
    universeId: activeUniverseId ?? universes[0]?.id ?? '',
    title: '',
    goal: '',
    difficulty: 'intermediate' as Difficulty,
    minutesPerDay: 30,
    durationDays: 7,
    strategy: 'prerequisite' as 'prerequisite' | 'weakest' | 'unexplored' | 'mastery',
  });

  const selectedPath = paths.find((p) => p.id === selectedPathId) ?? paths[0] ?? null;
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const formNodes = useMemo(
    () => nodes.filter((n) => n.universeId === form.universeId && n.type !== 'universe'),
    [nodes, form.universeId],
  );

  const orderedByPrereq = (list: KnowledgeNode[]) => {
    const ids = new Set(list.map((n) => n.id));
    const visited = new Set<string>();
    const out: KnowledgeNode[] = [];
    const visit = (n: KnowledgeNode) => {
      if (visited.has(n.id)) return;
      visited.add(n.id);
      for (const p of n.prerequisites) {
        const pre = list.find((x) => x.id === p);
        if (pre && ids.has(pre.id)) visit(pre);
      }
      out.push(n);
    };
    for (const n of list) visit(n);
    return out;
  };

  const generate = () => {
    const universeId = form.universeId;
    if (!universeId) {
      toast({ title: 'Pick a universe', tone: 'warn' });
      return;
    }
    let pool = formNodes;

    if (form.strategy === 'weakest') {
      pool = pool
        .filter((n) => progress[n.id]?.firstStudied)
        .sort((a, b) => (progress[a.id] ? computeMastery(progress[a.id]) : 0) - (progress[b.id] ? computeMastery(progress[b.id]) : 0));
    } else if (form.strategy === 'unexplored') {
      pool = pool.filter((n) => !progress[n.id]?.firstStudied);
    } else if (form.strategy === 'mastery') {
      pool = pool.filter((n) => (progress[n.id] ? computeMastery(progress[n.id]) : 0) < 85);
    } else {
      pool = orderedByPrereq(pool);
    }

    const difficultyRank = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 } as const;
    pool = pool
      .filter((n) => difficultyRank[n.difficulty] <= difficultyRank[form.difficulty])
      .slice(0, Math.max(3, Math.min(30, form.durationDays * 2)));

    if (pool.length === 0) {
      toast({ title: 'No concepts matched', description: 'Relax the difficulty or choose another strategy.', tone: 'warn' });
      return;
    }

    const universe = universes.find((u) => u.id === universeId);
    const title = form.title.trim() || `${form.strategy === 'weakest' ? 'Weak spots' : form.strategy === 'unexplored' ? 'Frontier' : 'Core path'} — ${universe?.name ?? 'Universe'}`;
    const id = createPath({
      universeId,
      title,
      goal: form.goal.trim() || `Cover ${pool.length} concepts over ${form.durationDays} days at ${form.minutesPerDay} minutes per day.`,
      nodeIds: pool.map((n) => n.id),
      difficulty: form.difficulty,
      minutesPerDay: form.minutesPerDay,
      durationDays: form.durationDays,
    });
    setSelectedPathId(id);
    setCreateOpen(false);
    toast({ title: 'Path generated', description: `${pool.length} steps added.`, tone: 'success' });
  };

  const removePath = async (id: string, title: string) => {
    const ok = await confirm({ title: `Delete "${title}"?`, description: 'The path is removed. Concept progress is untouched.', danger: true, confirmLabel: 'Delete path' });
    if (!ok) return;
    deletePath(id);
    if (selectedPathId === id) setSelectedPathId(null);
  };

  const steps = selectedPath?.steps ?? [];
  const completed = steps.filter((s) => s.completed).length;
  const nextStep = steps.find((s) => !s.completed && !s.skipped);
  const nextNode = nextStep ? byId.get(nextStep.nodeId) : null;
  const totalMinutes = steps.reduce((acc, s) => acc + (byId.get(s.nodeId)?.estimatedMinutes ?? 10), 0);

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Learning paths</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">A sequence, not a pile</h1>
          <p className="mt-1 text-xs text-muted">Generated from prerequisite order, weak spots, or your unexplored frontier.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn btn-primary h-8 text-[11px]">
          <Plus size={13} /> Generate path
        </button>
      </div>

      {paths.length === 0 ? (
        <EmptyState
          icon={<RouteIcon size={18} />}
          title="No learning paths yet"
          description="Generate a path and the engine will order concepts by prerequisite, difficulty and your current mastery."
          action={
            <button onClick={() => setCreateOpen(true)} className="btn btn-primary">
              <Sparkles size={14} /> Generate your first path
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {paths.map((p) => {
              const done = p.steps.filter((s) => s.completed).length;
              const active = selectedPath?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPathId(p.id)}
                  className={cn(
                    'w-full rounded-lg border p-2.5 text-left transition-colors',
                    active
                      ? 'border-[color-mix(in_srgb,var(--accent)_50%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]'
                      : 'border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--line))]',
                  )}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="min-w-0 flex-1 truncate text-[11.5px] font-medium">{p.title}</p>
                    {p.active && <Badge tone="accent">active</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted">{p.goal}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <ProgressBar value={percent(done, p.steps.length)} height={3} />
                    <span className="shrink-0 font-mono text-[9.5px] text-muted">
                      {done}/{p.steps.length}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedPath && (
            <motion.div key={selectedPath.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{selectedPath.title}</h2>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{selectedPath.goal}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => updatePath(selectedPath.id, { active: !selectedPath.active })}
                      className={cn('btn h-7 !px-2 text-[10px]', selectedPath.active ? 'btn-primary' : 'btn-ghost')}
                    >
                      {selectedPath.active ? 'Active' : 'Set active'}
                    </button>
                    <button onClick={() => void removePath(selectedPath.id, selectedPath.title)} className="btn btn-ghost h-7 w-7 !px-0" aria-label="Delete path">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ['Steps', `${completed}/${steps.length}`],
                    ['Difficulty', selectedPath.difficulty],
                    ['Daily', formatMinutes(selectedPath.minutesPerDay)],
                    ['Total', formatMinutes(totalMinutes)],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-md border border-[var(--line)] bg-[var(--panel2)]/40 p-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted">{String(label)}</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] capitalize">{String(value)}</p>
                    </div>
                  ))}
                </div>

                <ProgressBar value={percent(completed, Math.max(1, steps.length))} className="mt-3" />

                {nextNode && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[9.5px] uppercase tracking-widest text-muted">Up next</p>
                      <p className="truncate text-[11.5px] font-medium">{nextNode.title}</p>
                    </div>
                    <button onClick={() => navigate(`/app/node/${nextNode.id}`)} className="btn btn-primary h-7 text-[10px]">
                      Open <ArrowRight size={11} />
                    </button>
                  </div>
                )}
              </div>

              <div className="panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
                  <h3 className="text-[12px] font-semibold">Steps</h3>
                  <span className="text-[10px] text-muted">reorder, skip or complete</span>
                </div>
                <ol className="divide-y divide-[var(--line)]">
                  {steps.map((step, i) => {
                    const node = byId.get(step.nodeId);
                    if (!node) return null;
                    const p = progress[node.id];
                    const mastery = p ? computeMastery(p) : 0;
                    return (
                      <li key={step.nodeId} className={cn('flex items-center gap-2 px-3 py-2', step.skipped && 'opacity-45')}>
                        <button
                          onClick={() => togglePathStep(selectedPath.id, step.nodeId)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors"
                          style={{
                            borderColor: step.completed ? 'var(--mastery)' : 'var(--line)',
                            background: step.completed ? 'color-mix(in srgb, var(--mastery) 20%, transparent)' : 'transparent',
                          }}
                          aria-label={step.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {step.completed && <Check size={10} style={{ color: 'var(--mastery)' }} />}
                        </button>
                        <span className="w-4 shrink-0 font-mono text-[9.5px] text-muted">{i + 1}</span>
                        <button onClick={() => navigate(`/app/node/${node.id}`)} className="min-w-0 flex-1 text-left">
                          <span className={cn('block truncate text-[11.5px]', step.completed && 'line-through opacity-60')}>{node.title}</span>
                          <span className="block text-[9.5px] text-muted">
                            {node.type} · {node.difficulty} · {node.estimatedMinutes}m · mastery {mastery}%
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            disabled={i === 0}
                            onClick={() => reorderPathSteps(selectedPath.id, i, i - 1)}
                            className="btn btn-ghost h-6 w-6 !px-0 disabled:opacity-30"
                            aria-label="Move up"
                          >
                            <ArrowUp size={9} />
                          </button>
                          <button
                            disabled={i === steps.length - 1}
                            onClick={() => reorderPathSteps(selectedPath.id, i, i + 1)}
                            className="btn btn-ghost h-6 w-6 !px-0 disabled:opacity-30"
                            aria-label="Move down"
                          >
                            <ArrowDown size={9} />
                          </button>
                          <button
                            onClick={() => skipPathStep(selectedPath.id, step.nodeId)}
                            className={cn('btn h-6 w-6 !px-0', step.skipped ? 'btn-primary' : 'btn-ghost')}
                            aria-label="Toggle skip"
                          >
                            {step.skipped ? <X size={9} /> : <SkipForward size={9} />}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="panel p-4">
                <SectionTitle title="Pace projection" hint={`${selectedPath.durationDays} day plan`} />
                <div className="space-y-1.5 text-[11px] text-muted">
                  <p className="flex justify-between">
                    <span>Concepts remaining</span>
                    <span className="font-mono text-ink">{steps.length - completed}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Estimated study time</span>
                    <span className="font-mono text-ink">{formatMinutes(totalMinutes * (1 - completed / Math.max(1, steps.length)))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Concepts per day</span>
                    <span className="font-mono text-ink">{Math.max(1, Math.ceil((steps.length - completed) / selectedPath.durationDays))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Daily time at that pace</span>
                    <span className="font-mono text-ink">
                      {formatMinutes(Math.ceil(totalMinutes / Math.max(1, selectedPath.durationDays)))}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Generate a learning path"
        description="Pick a strategy and the engine orders concepts for you."
        width="max-w-lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={generate}>
              <Sparkles size={13} /> Generate
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label mb-1 block" htmlFor="path-universe">
              Universe
            </label>
            <select id="path-universe" value={form.universeId} onChange={(e) => setForm((f) => ({ ...f, universeId: e.target.value }))} className="input">
              {universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="label mb-1.5">Strategy</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {[
                ['prerequisite', 'Prerequisite order', 'Respect dependency chains'],
                ['weakest', 'Weakest first', 'Lowest mastery concepts'],
                ['unexplored', 'Frontier', 'Nothing studied yet'],
                ['mastery', 'Mastery push', 'Everything under 85%'],
              ].map(([id, title, body]) => (
                <button
                  key={id}
                  onClick={() => setForm((f) => ({ ...f, strategy: id as typeof f.strategy }))}
                  className={cn(
                    'rounded-lg border px-2.5 py-2 text-left transition-colors',
                    form.strategy === id
                      ? 'border-[color-mix(in_srgb,var(--accent)_55%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]'
                      : 'border-[var(--line)]',
                  )}
                >
                  <span className="block text-[11px] font-medium">{title}</span>
                  <span className="block text-[9.5px] text-muted">{body}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="label mb-1 block" htmlFor="path-difficulty">
                Max difficulty
              </label>
              <select
                id="path-difficulty"
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
                className="input"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="label mb-1 block" htmlFor="path-days">
                Duration (days)
              </label>
              <input
                id="path-days"
                type="number"
                min={1}
                max={60}
                value={form.durationDays}
                onChange={(e) => setForm((f) => ({ ...f, durationDays: Math.max(1, Math.min(60, Number(e.target.value) || 1)) }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label mb-1 block" htmlFor="path-minutes">
              Minutes per day: <span className="font-mono text-ink">{form.minutesPerDay}</span>
            </label>
            <input
              id="path-minutes"
              type="range"
              min={5}
              max={180}
              step={5}
              value={form.minutesPerDay}
              onChange={(e) => setForm((f) => ({ ...f, minutesPerDay: Number(e.target.value) }))}
              className="w-full accent-[var(--accent)]"
            />
          </div>

          <div>
            <label className="label mb-1 block" htmlFor="path-title">
              Title <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>
            </label>
            <input
              id="path-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Two weeks to model evaluation"
              className="input"
            />
          </div>

          <div>
            <label className="label mb-1 block" htmlFor="path-goal">
              Goal <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="path-goal"
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              rows={2}
              className="input resize-none"
              placeholder="What should be true when you finish?"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

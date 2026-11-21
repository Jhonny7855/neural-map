import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  Check,
  ChevronRight,
  Clock,
  Flag,
  ListChecks,
  Play,
  RotateCcw,
  Target,
  Timer,
  Trophy,
  X,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, Modal, ProgressBar, SectionTitle, Tabs } from '@/components/ui';
import { QuestionInput, isAnswered, type Given } from '@/components/QuestionInput';
import { gradeAnswer } from '@/lib/learning';
import { cn, formatDuration, percent, shuffle, uid } from '@/lib/utils';
import type { Difficulty, Question, QuizAttempt } from '@/types';

type Mode = 'concept' | 'branch' | 'universe' | 'weak' | 'custom';
type Phase = 'setup' | 'running' | 'review';

interface SessionQuestion {
  question: Question;
  nodeId: string;
  nodeTitle: string;
  universeId: string;
}

const MODE_META: Record<Mode, { title: string; body: string; icon: typeof Target }> = {
  concept: { title: 'Concept test', body: 'Test one concept in depth using its own question bank.', icon: Target },
  branch: { title: 'Branch test', body: 'Cover a parent concept and every concept beneath it.', icon: ListChecks },
  universe: { title: 'Universe sweep', body: 'Sample questions from across the entire universe.', icon: Trophy },
  weak: { title: 'Weak-spot drill', body: 'Only questions from concepts you have struggled with.', icon: AlertTriangle },
  custom: { title: 'Custom mix', body: 'Pick a size, difficulty band and timer yourself.', icon: Timer },
};

export function ExamArena() {
  const universes = useApp((s) => s.universes);
  const nodes = useApp((s) => s.nodes);
  const progress = useApp((s) => s.progress);
  const attempts = useApp((s) => s.attempts);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const recordAnswer = useApp((s) => s.recordAnswer);
  const saveAttempt = useApp((s) => s.saveAttempt);
  const completeConceptTest = useApp((s) => s.completeConceptTest);
  const toast = useApp((s) => s.toast);

  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [mode, setMode] = useState<Mode>('universe');
  const [universeId, setUniverseId] = useState(activeUniverseId ?? universes[0]?.id ?? '');
  const [anchorNodeId, setAnchorNodeId] = useState('');
  const [size, setSize] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [timerOn, setTimerOn] = useState(false);
  const [minutes, setMinutes] = useState(10);
  const [negative, setNegative] = useState(false);

  const [phase, setPhase] = useState<Phase>('setup');
  const [session, setSession] = useState<SessionQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Given>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const submittedRef = useRef(false);

  const universe = universes.find((u) => u.id === universeId) ?? universes[0];
  const universeNodes = useMemo(() => nodes.filter((n) => n.universeId === universe?.id), [nodes, universe?.id]);

  useEffect(() => {
    if (!universeId && universes[0]) setUniverseId(universes[0].id);
  }, [universes, universeId]);

  const anchorCandidates = useMemo(() => {
    if (mode === 'concept') return universeNodes.filter((n) => n.questions.length > 0);
    if (mode === 'branch') return universeNodes.filter((n) => nodes.some((c) => c.parentId === n.id && c.questions.length > 0));
    return [];
  }, [mode, universeNodes, nodes]);

  const descendantIds = (rootId: string) => {
    const out = new Set<string>([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of nodes) {
        if (n.parentId && out.has(n.parentId) && !out.has(n.id)) {
          out.add(n.id);
          changed = true;
        }
      }
    }
    return out;
  };

  const pool = useMemo<SessionQuestion[]>(() => {
    if (!universe) return [];
    let scoped = universeNodes;

    if (mode === 'concept' && anchorNodeId) scoped = universeNodes.filter((n) => n.id === anchorNodeId);
    if (mode === 'branch' && anchorNodeId) {
      const ids = descendantIds(anchorNodeId);
      scoped = universeNodes.filter((n) => ids.has(n.id));
    }
    if (mode === 'weak') {
      scoped = universeNodes.filter((n) => {
        const p = progress[n.id];
        return p && (p.incorrectQuestions.length > 0 || (p.quizAttempts > 0 && p.quizCorrect / p.quizAttempts < 0.7));
      });
      if (scoped.length === 0) scoped = universeNodes.filter((n) => progress[n.id]?.firstStudied);
    }

    const out: SessionQuestion[] = [];
    for (const n of scoped) {
      for (const q of n.questions) {
        if (difficulty !== 'all' && q.difficulty !== difficulty) continue;
        out.push({ question: q, nodeId: n.id, nodeTitle: n.title, universeId: n.universeId });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe, universeNodes, mode, anchorNodeId, difficulty, progress, nodes]);

  useEffect(() => {
    if (mode === 'concept' || mode === 'branch') {
      if (!anchorCandidates.some((n) => n.id === anchorNodeId)) setAnchorNodeId(anchorCandidates[0]?.id ?? '');
    } else {
      setAnchorNodeId('');
    }
  }, [mode, anchorCandidates, anchorNodeId]);

  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(t);
  }, [phase, startedAt]);

  const limitSec = timerOn ? minutes * 60 : 0;
  const remaining = timerOn ? Math.max(0, limitSec - Math.floor(elapsed / 1000)) : null;

  const finish = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const durationMs = Date.now() - startedAt;
    let correct = 0;
    const records: QuizAttempt['answers'] = [];

    for (const item of session) {
      const given = answers[item.question.id] ?? null;
      const graded = gradeAnswer(item.question, given);
      if (graded.correct) correct += 1;
      records.push({
        questionId: item.question.id,
        nodeId: item.nodeId,
        prompt: item.question.prompt,
        given,
        correct: graded.correct,
        correctAnswer: graded.normalized,
        explanation: item.question.explanation,
      });
      if (isAnswered(item.question, given)) {
        recordAnswer(item.nodeId, item.question.id, given);
      }
    }

    const total = session.length;
    const penalty = negative ? session.length - correct : 0;
    const score = Math.max(0, Math.round(((correct - penalty * 0.25) / Math.max(1, total)) * 100));

    const attempt: QuizAttempt = {
      id: uid('attempt'),
      quizId: uid('quiz'),
      universeId: session[0]?.universeId ?? universe?.id ?? '',
      title: `${MODE_META[mode].title} · ${total} questions`,
      mode,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs,
      total,
      correct,
      score,
      answers: records,
    };

    saveAttempt(attempt);
    setLastAttempt(attempt);

    const byNode = new Map<string, { correct: number; total: number }>();
    for (const r of records) {
      const entry = byNode.get(r.nodeId) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (r.correct) entry.correct += 1;
      byNode.set(r.nodeId, entry);
    }
    for (const [nodeId, stat] of byNode) completeConceptTest(nodeId, stat.correct, stat.total);

    setPhase('review');
    toast({
      title: `Score ${score}%`,
      description: `${correct}/${total} correct in ${formatDuration(durationMs)}`,
      tone: score >= 80 ? 'success' : score >= 50 ? 'info' : 'warn',
    });
  };

  useEffect(() => {
    if (phase === 'running' && timerOn && remaining === 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase, timerOn]);

  const start = () => {
    if (!universe) return;
    const selected = shuffle(pool).slice(0, Math.max(1, Math.min(size, pool.length)));
    if (selected.length === 0) {
      toast({ title: 'No questions available', description: 'Try another mode or add questions to this universe.', tone: 'warn' });
      return;
    }
    setSession(selected);
    setAnswers({});
    setFlagged(new Set());
    setCursor(0);
    setLastAttempt(null);
    setStartedAt(Date.now());
    setElapsed(0);
    submittedRef.current = false;
    setPhase('running');
  };

  const restart = () => {
    setPhase('setup');
    setSession([]);
    setAnswers({});
    setFlagged(new Set());
    setLastAttempt(null);
  };

  const current = session[cursor];
  const answeredCount = session.filter((s) => isAnswered(s.question, answers[s.question.id] ?? null)).length;

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Exam arena</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">Prove what you know</h1>
          <p className="mt-1 text-xs text-muted">Tests are graded against the question bank and update mastery per concept.</p>
        </div>
        {phase !== 'setup' && (
          <Badge tone="warn">
            <Clock size={10} /> {formatDuration(elapsed)}
          </Badge>
        )}
      </div>

      {phase === 'setup' && (
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'new', label: 'New test', icon: <Play size={12} /> },
              { id: 'history', label: 'History', icon: <RotateCcw size={12} />, count: attempts.length },
            ]}
          />

          {tab === 'new' ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <div className="space-y-3">
                <div className="panel p-4">
                  <SectionTitle title="Mode" hint="what should this test cover?" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(Object.keys(MODE_META) as Mode[]).map((m) => {
                      const meta = MODE_META[m];
                      const active = mode === m;
                      return (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={cn(
                            'rounded-lg border px-3 py-2.5 text-left transition-colors',
                            active
                              ? 'border-[color-mix(in_srgb,var(--accent)_55%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]'
                              : 'border-[var(--line)] hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--line))]',
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <meta.icon size={12} className={active ? 'text-[var(--accent)]' : 'text-muted'} />
                            <span className="text-[11.5px] font-semibold">{meta.title}</span>
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-snug text-muted">{meta.body}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="panel p-4">
                  <SectionTitle title="Scope" hint={`${pool.length} questions in scope`} />
                  <div className="space-y-2.5">
                    <div>
                      <label className="label mb-1 block" htmlFor="exam-universe">
                        Universe
                      </label>
                      <select id="exam-universe" value={universeId} onChange={(e) => setUniverseId(e.target.value)} className="input text-[11.5px]">
                        {universes.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(mode === 'concept' || mode === 'branch') && (
                      <div>
                        <label className="label mb-1 block" htmlFor="exam-anchor">
                          {mode === 'concept' ? 'Concept' : 'Branch root'}
                        </label>
                        <select id="exam-anchor" value={anchorNodeId} onChange={(e) => setAnchorNodeId(e.target.value)} className="input text-[11.5px]">
                          {anchorCandidates.length === 0 && <option value="">No concepts with questions</option>}
                          {anchorCandidates.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="label mb-1 block" htmlFor="exam-size">
                          Questions: {size}
                        </label>
                        <input
                          id="exam-size"
                          type="range"
                          min={1}
                          max={Math.max(1, Math.min(40, pool.length))}
                          value={Math.min(size, Math.max(1, pool.length))}
                          onChange={(e) => setSize(Number(e.target.value))}
                          className="w-full accent-[var(--accent)]"
                        />
                      </div>
                      <div>
                        <label className="label mb-1 block" htmlFor="exam-difficulty">
                          Difficulty
                        </label>
                        <select
                          id="exam-difficulty"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as Difficulty | 'all')}
                          className="input text-[11.5px]"
                        >
                          <option value="all">Any difficulty</option>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-2.5">
                      <label className="flex items-center gap-1.5 text-[11px] text-muted">
                        <input type="checkbox" checked={timerOn} onChange={(e) => setTimerOn(e.target.checked)} className="accent-[var(--accent)]" />
                        Timed test
                      </label>
                      {timerOn && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={minutes}
                            onChange={(e) => setMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                            className="w-16 rounded border border-[var(--line)] bg-[var(--panel2)] px-1.5 py-1 font-mono text-[11px] outline-none"
                          />
                          <span className="text-[10px] text-muted">minutes</span>
                        </div>
                      )}
                      <label className="flex items-center gap-1.5 text-[11px] text-muted">
                        <input type="checkbox" checked={negative} onChange={(e) => setNegative(e.target.checked)} className="accent-[var(--accent)]" />
                        Negative marking
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="panel p-4">
                  <SectionTitle title="Ready to begin" hint={MODE_META[mode].title} />
                  <div className="space-y-1.5 text-[11px] text-muted">
                    <div className="flex justify-between">
                      <span>Universe</span>
                      <span className="truncate text-ink">{universe?.name ?? 'none'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Questions available</span>
                      <span className="font-mono">{pool.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Questions in test</span>
                      <span className="font-mono">{Math.min(size, pool.length)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time limit</span>
                      <span className="font-mono">{timerOn ? `${minutes}m` : 'none'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Negative marking</span>
                      <span className="font-mono">{negative ? 'on' : 'off'}</span>
                    </div>
                  </div>
                  <button
                    onClick={start}
                    disabled={pool.length === 0}
                    className="btn btn-primary mt-3 h-9 w-full text-xs"
                  >
                    <Play size={13} /> Start test
                  </button>
                  {pool.length === 0 && (
                    <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
                      No questions match this scope. Try the universe sweep, or pick a different difficulty.
                    </p>
                  )}
                </div>

                <div className="panel p-4">
                  <SectionTitle title="Weakest concepts" hint="highest error rate" />
                  {universeNodes.filter((n) => progress[n.id]?.quizAttempts).length === 0 ? (
                    <p className="text-[10.5px] text-muted">Take a test first — this list fills in from your results.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {universeNodes
                        .filter((n) => progress[n.id]?.quizAttempts)
                        .map((n) => ({ n, p: progress[n.id] }))
                        .sort((a, b) => a.p.quizCorrect / a.p.quizAttempts - b.p.quizCorrect / b.p.quizAttempts)
                        .slice(0, 5)
                        .map(({ n, p }) => (
                          <li key={n.id} className="flex items-center justify-between gap-2 text-[10.5px]">
                            <span className="truncate">{n.title}</span>
                            <span className="shrink-0 font-mono text-muted">{percent(p.quizCorrect, p.quizAttempts)}%</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {attempts.length === 0 ? (
                <EmptyState icon={<Trophy size={18} />} title="No attempts yet" description="Finish a test and it will appear here with a per-question breakdown." />
              ) : (
                attempts.map((a) => (
                  <div key={a.id} className="panel flex flex-wrap items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium">{a.title}</p>
                      <p className="text-[10px] text-muted">
                        {new Date(a.finishedAt).toLocaleString()} · {formatDuration(a.durationMs)} · {a.mode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <ProgressBar value={a.score} height={4} tone={a.score >= 80 ? 'mastery' : a.score >= 50 ? 'accent' : 'warn'} />
                      </div>
                      <Badge tone={a.score >= 80 ? 'mastery' : a.score >= 50 ? 'accent' : 'warn'}>{a.score}%</Badge>
                      <span className="font-mono text-[10px] text-muted">
                        {a.correct}/{a.total}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {phase === 'running' && current && (
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-2.5">
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span className="font-mono">
                  {cursor + 1}/{session.length}
                </span>
                <span className="opacity-40">·</span>
                <span>{answeredCount} answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                {timerOn && (
                  <Badge tone={remaining !== null && remaining < 60 ? 'danger' : 'warn'}>
                    <Clock size={10} /> {formatDuration((remaining ?? 0) * 1000)}
                  </Badge>
                )}
                <button
                  onClick={() => setFlagged((f) => {
                    const next = new Set(f);
                    if (next.has(current.question.id)) next.delete(current.question.id);
                    else next.add(current.question.id);
                    return next;
                  })}
                  className={cn('btn h-6 !px-2 text-[10px]', flagged.has(current.question.id) ? 'btn-primary' : 'btn-ghost')}
                >
                  <Flag size={10} /> {flagged.has(current.question.id) ? 'Flagged' : 'Flag'}
                </button>
                <button onClick={() => setConfirmAbandon(true)} className="btn btn-ghost h-6 !px-2 text-[10px]">
                  <X size={10} /> Exit
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <Badge tone="neutral">{current.question.type}</Badge>
                <Badge tone="neutral">{current.question.difficulty}</Badge>
                <Link to={`/app/node/${current.nodeId}`} className="text-[10px] text-[var(--accent)] hover:underline">
                  {current.nodeTitle}
                </Link>
              </div>
              <p className="text-[13px] font-medium leading-relaxed">{current.question.prompt}</p>

              <div className="mt-3">
                <QuestionInput
                  question={current.question}
                  value={answers[current.question.id] ?? null}
                  onChange={(v) => setAnswers((a) => ({ ...a, [current.question.id]: v }))}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
                <button
                  disabled={cursor === 0}
                  onClick={() => setCursor((c) => Math.max(0, c - 1))}
                  className="btn btn-ghost h-8 text-[11px]"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1.5">
                  {cursor < session.length - 1 ? (
                    <button onClick={() => setCursor((c) => Math.min(session.length - 1, c + 1))} className="btn btn-primary h-8 text-[11px]">
                      Next <ChevronRight size={12} />
                    </button>
                  ) : (
                    <button onClick={finish} className="btn btn-primary h-8 text-[11px]">
                      <Check size={12} /> Submit test
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="panel h-fit p-3">
            <p className="label mb-2">Question map</p>
            <div className="grid grid-cols-6 gap-1">
              {session.map((s, i) => {
                const answered = isAnswered(s.question, answers[s.question.id] ?? null);
                return (
                  <button
                    key={s.question.id}
                    onClick={() => setCursor(i)}
                    className={cn(
                      'flex h-7 items-center justify-center rounded border font-mono text-[10px] transition-colors',
                      i === cursor
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : answered
                          ? 'border-[color-mix(in_srgb,var(--mastery)_45%,var(--line))] text-[var(--mastery)]'
                          : 'border-[var(--line)] text-muted',
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 border-t border-[var(--line)] pt-2 text-[10px] text-muted">
              <p className="flex justify-between">
                <span>Answered</span>
                <span className="font-mono">{answeredCount}/{session.length}</span>
              </p>
              <p className="flex justify-between">
                <span>Flagged</span>
                <span className="font-mono">{flagged.size}</span>
              </p>
            </div>
            <button onClick={finish} className="btn btn-ghost mt-3 h-8 w-full text-[11px]">
              Submit now
            </button>
          </div>
        </div>
      )}

      {phase === 'review' && lastAttempt && (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel overflow-hidden"
          >
            <div
              className="border-b border-[var(--line)] px-4 py-5 text-center"
              style={{ background: 'linear-gradient(160deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%)' }}
            >
              <div
                className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--mastery) 15%, transparent)' }}
              >
                <Award size={22} style={{ color: 'var(--mastery)' }} />
              </div>
              <p className="font-display text-3xl font-semibold" style={{ color: 'var(--accent)' }}>
                {lastAttempt.score}%
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {lastAttempt.correct}/{lastAttempt.total} correct · {formatDuration(lastAttempt.durationMs)}
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <button onClick={restart} className="btn btn-primary h-8 text-[11px]">
                  <RotateCcw size={12} /> New test
                </button>
                <button onClick={() => setTab('history')} className="btn btn-ghost h-8 text-[11px]">
                  View history
                </button>
              </div>
            </div>

            <div className="divide-y divide-[var(--line)]">
              {lastAttempt.answers.map((r, i) => (
                <div key={r.questionId} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                      style={{ background: r.correct ? 'color-mix(in srgb, var(--mastery) 22%, transparent)' : 'rgba(255,107,129,0.18)' }}
                    >
                      {r.correct ? (
                        <Check size={9} style={{ color: 'var(--mastery)' }} />
                      ) : (
                        <X size={9} style={{ color: '#FF6B81' }} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] leading-snug">
                        <span className="mr-1 font-mono text-[10px] text-muted">Q{i + 1}</span>
                        {r.prompt}
                      </p>
                      {!r.correct && (
                        <p className="mt-1 text-[10.5px] text-muted">
                          <span className="font-semibold" style={{ color: 'var(--mastery)' }}>
                            Correct:{" "}
                          </span>
                          {JSON.stringify(r.correctAnswer)}
                          {r.given !== null && (
                            <>
                              {' · '}
                              <span className="font-semibold" style={{ color: '#FF8A9B' }}>
                                You:{' '}
                              </span>
                              {JSON.stringify(r.given)}
                            </>
                          )}
                        </p>
                      )}
                      <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{r.explanation}</p>
                      <Link to={`/app/node/${r.nodeId}`} className="mt-1 inline-block text-[10px] text-[var(--accent)] hover:underline">
                        Revisit concept
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <Modal
        open={confirmAbandon}
        onClose={() => setConfirmAbandon(false)}
        title="Abandon this test?"
        description="Unsubmitted answers are discarded and no attempt is recorded."
        width="max-w-sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmAbandon(false)}>
              Keep going
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,107,129,0.16)', border: '1px solid rgba(255,107,129,0.5)', color: '#FF8A9B' }}
              onClick={() => {
                setConfirmAbandon(false);
                restart();
              }}
            >
              Abandon
            </button>
          </>
        }
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  Crosshair,
  Eye,
  FileText,
  Lightbulb,
  Link2,
  ListChecks,
  Play,
  RefreshCw,
  Sigma,
  Sparkles,
  Target,
  Waypoints,
  X,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, ProgressBar, SectionTitle, Tabs, Tooltip, useTimeTracker } from '@/components/ui';
import { STATUS_META, TYPE_META } from '@/components/graph/KnowledgeNode';
import { NodeVisual } from '@/components/NodeVisual';
import { QuestionInput, isAnswered, type Given } from '@/components/QuestionInput';
import { computeMastery, forgettingRisk, isDue, scheduleRevision } from '@/lib/learning';
import { cn, formatDuration, percent, renderMarkdown, timeAgo } from '@/lib/utils';
import type { KnowledgeNode, NodeStatus } from '@/types';

type Tab = 'learn' | 'examples' | 'practice' | 'connections' | 'progress';

export function NodeExplorer() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();

  const nodes = useApp((s) => s.nodes);
  const edges = useApp((s) => s.edges);
  const progressMap = useApp((s) => s.progress);
  const selectNode = useApp((s) => s.selectNode);
  const setActiveUniverse = useApp((s) => s.setActiveUniverse);
  const markTheoryRead = useApp((s) => s.markTheoryRead);
  const recordAnswer = useApp((s) => s.recordAnswer);
  const completeConceptTest = useApp((s) => s.completeConceptTest);
  const runRevision = useApp((s) => s.runRevision);
  const toast = useApp((s) => s.toast);
  const createEdge = useApp((s) => s.createEdge);

  const node = nodes.find((n) => n.id === nodeId) ?? null;
  useTimeTracker(node?.id ?? null);

  const [tab, setTab] = useState<Tab>('learn');
  const [answers, setAnswers] = useState<Record<string, Given>>({});
  const [results, setResults] = useState<Record<string, { correct: boolean; explanation: string; correctAnswer: unknown }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [linkTarget, setLinkTarget] = useState('');

  useEffect(() => {
    if (node) {
      selectNode(node.id);
      setActiveUniverse(node.universeId);
    }
    setTab('learn');
    setAnswers({});
    setResults({});
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  const progress = node ? progressMap[node.id] : undefined;
  const mastery = progress ? computeMastery(progress) : 0;
  const status: NodeStatus = progress?.status ?? 'unexplored';

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const children = useMemo(() => nodes.filter((n) => n.parentId === node?.id), [nodes, node?.id]);
  const parent = node?.parentId ? byId.get(node.parentId) ?? null : null;
  const prereqs = (node?.prerequisites ?? []).map((id) => byId.get(id)).filter((n): n is KnowledgeNode => Boolean(n));
  const related = (node?.related ?? []).map((id) => byId.get(id)).filter((n): n is KnowledgeNode => Boolean(n));
  const extensions = (node?.extensions ?? []).map((id) => byId.get(id)).filter((n): n is KnowledgeNode => Boolean(n));
  const contrasts = (node?.contrasts ?? []).map((id) => byId.get(id)).filter((n): n is KnowledgeNode => Boolean(n));
  const nodeEdges = useMemo(() => edges.filter((e) => e.source === node?.id || e.target === node?.id), [edges, node?.id]);

  const siblings = useMemo(() => {
    if (!node) return [];
    return nodes.filter((n) => n.parentId === node.parentId && n.id !== node.id);
  }, [nodes, node]);

  const orderedSiblings = useMemo(() => {
    if (!node) return { prev: null, next: null };
    const list = [...(siblings ?? [])].sort((a, b) => a.title.localeCompare(b.title));
    return { prev: list[0] ?? null, next: list[1] ?? null };
  }, [siblings, node]);

  if (!node) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={<Compass size={18} />}
          title="Concept not found"
          description="This node may have been deleted, or the link points to another universe. Pick a concept from the graph instead."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/app/neural-space')}>
              Open Neural Space
            </button>
          }
        />
      </div>
    );
  }

  const meta = TYPE_META[node.type];
  const statusMeta = STATUS_META[status];
  const questions = node.questions;
  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.id] ?? null)).length;

  const submitAnswer = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const given = answers[questionId] ?? null;
    if (!isAnswered(question, given)) {
      toast({ title: 'Answer required', description: 'Choose or type an answer first.', tone: 'warn' });
      return;
    }
    const result = recordAnswer(node.id, questionId, given);
    setResults((r) => ({ ...r, [questionId]: result }));
  };

  const submitAll = () => {
    let correct = 0;
    let answered = 0;
    for (const q of questions) {
      const given = answers[q.id] ?? null;
      if (!isAnswered(q, given)) continue;
      answered += 1;
      if (!results[q.id]) {
        const result = recordAnswer(node.id, q.id, given);
        setResults((r) => ({ ...r, [q.id]: result }));
        if (result.correct) correct += 1;
      } else if (results[q.id].correct) {
        correct += 1;
      }
    }
    if (!answered) {
      toast({ title: 'Nothing to submit', description: 'Answer at least one question.', tone: 'warn' });
      return;
    }
    setSubmitted(true);
    completeConceptTest(node.id, correct, answered);
    toast({
      title: `${correct}/${answered} correct`,
      description: correct === answered ? 'Perfect run — mastery updated.' : 'Review the explanations below.',
      tone: correct === answered ? 'success' : 'info',
    });
  };

  const copySummary = async () => {
    const text = [
      `# ${node.title}`,
      node.summary,
      '',
      ...node.theory.map((t) => `## ${t.heading}\n${t.body}`),
      '',
      node.formulas.length ? `## Formulas\n${node.formulas.map((f) => `- ${f.name}: ${f.expression}`).join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard', description: 'Theory and formulas copied as Markdown.', tone: 'success' });
    } catch {
      toast({ title: 'Clipboard unavailable', tone: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
        <Link to="/app/neural-space" className="hover:text-ink">
          Neural Space
        </Link>
        {parent && (
          <>
            <ChevronRight size={11} className="opacity-50" />
            <button onClick={() => navigate(`/app/node/${parent.id}`)} className="hover:text-ink">
              {parent.title}
            </button>
          </>
        )}
        <ChevronRight size={11} className="opacity-50" />
        <span className="truncate text-ink">{node.title}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <div className="panel overflow-hidden">
            <div
              className="relative border-b border-[var(--line)] px-4 py-4"
              style={{ background: `linear-gradient(140deg, color-mix(in srgb, ${meta.color} 10%, transparent), transparent 65%)` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded"
                      style={{ background: `color-mix(in srgb, ${meta.color} 18%, transparent)`, color: meta.color }}
                    >
                      <meta.icon size={11} />
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="opacity-40">·</span>
                    <span className="text-[10px] text-muted">{node.difficulty}</span>
                    <span className="opacity-40">·</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted">
                      <Clock size={9} /> {node.estimatedMinutes}m
                    </span>
                  </div>
                  <h1 className="mt-1.5 font-display text-xl font-semibold tracking-tight sm:text-2xl">{node.title}</h1>
                  <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">{node.summary}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge tone={status === 'mastered' ? 'mastery' : status === 'needs-revision' ? 'warn' : 'accent'}>
                    {statusMeta.label}
                  </Badge>
                  <span className="font-mono text-[10px] text-muted">{mastery}% mastery</span>
                </div>
              </div>

              {node.importance && (
                <p className="mt-3 rounded-md border border-[var(--line)] bg-[var(--panel2)]/50 px-2.5 py-1.5 text-[11px] leading-relaxed">
                  <span className="font-semibold" style={{ color: meta.color }}>
                    Why it matters:{' '}
                  </span>
                  <span className="text-muted">{node.importance}</span>
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {!progress?.theoryRead && node.theory.length > 0 && (
                  <button
                    onClick={() => {
                      markTheoryRead(node.id);
                      toast({ title: 'Theory marked complete', description: '+20 XP', tone: 'success' });
                    }}
                    className="btn btn-primary h-7 !px-2.5 text-[10px]"
                  >
                    <Check size={11} /> Mark theory read
                  </button>
                )}
                {progress?.theoryRead && (
                  <Badge tone="mastery">
                    <CheckCircle2 size={10} /> theory complete
                  </Badge>
                )}
                <button onClick={copySummary} className="btn btn-ghost h-7 !px-2.5 text-[10px]">
                  <Copy size={11} /> Copy notes
                </button>
                {isDue(progress ?? { revisionDue: null } as never) && (
                  <button
                    onClick={() => {
                      runRevision(node.id, 4);
                      toast({ title: 'Revision logged', description: 'Recall quality 4/5 — next review scheduled.', tone: 'success' });
                    }}
                    className="btn btn-ghost h-7 !px-2.5 text-[10px]"
                  >
                    <RefreshCw size={11} /> Log revision
                  </button>
                )}
                {node.questions.length > 0 && (
                  <button onClick={() => setTab('practice')} className="btn btn-ghost h-7 !px-2.5 text-[10px]">
                    <Target size={11} /> Practice ({node.questions.length})
                  </button>
                )}
              </div>
            </div>

            <Tabs
              className="px-2"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'learn', label: 'Learn', icon: <BookOpen size={12} /> },
                { id: 'examples', label: 'Examples', icon: <Lightbulb size={12} />, count: node.examples.length + node.formulas.length },
                { id: 'practice', label: 'Practice', icon: <Target size={12} />, count: node.questions.length },
                { id: 'connections', label: 'Connections', icon: <Link2 size={12} />, count: nodeEdges.length },
                { id: 'progress', label: 'Progress', icon: <Waypoints size={12} /> },
              ]}
            />

            <div className="p-4">
              {tab === 'learn' && (
                <div className="space-y-4">
                  {node.objectives.length > 0 && (
                    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-3">
                      <p className="label mb-1.5">Learning objectives</p>
                      <ul className="space-y-1">
                        {node.objectives.map((o, i) => (
                          <li key={i} className="flex gap-1.5 text-[11.5px] leading-snug text-muted">
                            <Target size={10} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {node.theory.length === 0 && (
                    <p className="text-[11.5px] text-muted">No theory has been written for this concept yet.</p>
                  )}

                  {node.theory.map((section, i) => (
                    <section key={i}>
                      <h3 className="mb-1.5 text-sm font-semibold">{section.heading}</h3>
                      <div
                        className="prose-nm text-[12.5px]"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(section.body) }}
                      />
                    </section>
                  ))}

                  {node.definitions.length > 0 && (
                    <div>
                      <h3 className="mb-1.5 text-sm font-semibold">Key definitions</h3>
                      <dl className="space-y-1.5">
                        {node.definitions.map((d, i) => (
                          <div key={i} className="rounded-md border border-[var(--line)] bg-[var(--panel2)]/30 px-2.5 py-1.5">
                            <dt className="text-[11.5px] font-semibold">{d.term}</dt>
                            <dd className="mt-0.5 text-[11px] leading-relaxed text-muted">{d.meaning}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {node.keyPrinciples.length > 0 && (
                    <div>
                      <h3 className="mb-1.5 text-sm font-semibold">Key principles</h3>
                      <ul className="space-y-1">
                        {node.keyPrinciples.map((p, i) => (
                          <li key={i} className="flex gap-1.5 text-[11.5px] leading-snug text-muted">
                            <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--mastery)' }} />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {node.visuals.length > 0 && (
                    <div>
                      <h3 className="mb-1.5 text-sm font-semibold">Visual models</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {node.visuals.map((v, i) => (
                          <NodeVisual key={i} spec={v} />
                        ))}
                      </div>
                    </div>
                  )}

                  {node.applications.length > 0 && (
                    <div>
                      <h3 className="mb-1.5 text-sm font-semibold">Applications</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {node.applications.map((a, i) => (
                          <div key={i} className="rounded-md border border-[var(--line)] bg-[var(--panel2)]/30 p-2.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="text-[11.5px] font-semibold">{a.title}</p>
                              {a.industry && <Badge tone="neutral">{a.industry}</Badge>}
                            </div>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{a.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {node.sourceRefs.length > 0 && (
                    <div>
                      <h3 className="mb-1.5 text-sm font-semibold">Sources</h3>
                      <ul className="space-y-1">
                        {node.sourceRefs.map((s, i) => (
                          <li key={i} className="flex gap-1.5 text-[10.5px] leading-snug text-muted">
                            <FileText size={9} className="mt-0.5 shrink-0" />
                            <span>
                              {s.documentName}
                              {s.chapter ? ` · ${s.chapter}` : ''}
                              {s.page ? ` · p.${s.page}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {tab === 'examples' && (
                <div className="space-y-4">
                  {node.formulas.length === 0 && node.examples.length === 0 && (
                    <p className="text-[11.5px] text-muted">No formulas or worked examples for this concept.</p>
                  )}

                  {node.formulas.map((f, i) => (
                    <div key={i} className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/30 p-3">
                      <div className="flex items-center gap-1.5">
                        <Sigma size={11} style={{ color: '#FFB86B' }} />
                        <p className="text-[12px] font-semibold">{f.name}</p>
                      </div>
                      <p className="mt-1.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1.5 font-mono text-[12px]" style={{ color: 'var(--accent)' }}>
                        {f.expression}
                      </p>
                      {f.variables.length > 0 && (
                        <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                          {f.variables.map((v, j) => (
                            <li key={j} className="flex gap-1.5 text-[10.5px] text-muted">
                              <span className="font-mono" style={{ color: 'var(--accent)' }}>
                                {v.symbol}
                              </span>
                              <span>{v.meaning}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {f.whenToUse && (
                        <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
                          <span className="font-semibold text-ink">When to use: </span>
                          {f.whenToUse}
                        </p>
                      )}
                      {f.derivation && (
                        <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                          <span className="font-semibold text-ink">Derivation: </span>
                          {f.derivation}
                        </p>
                      )}
                      {f.example && (
                        <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                          <span className="font-semibold text-ink">Example: </span>
                          {f.example}
                        </p>
                      )}
                      {f.mistakes && f.mistakes.length > 0 && (
                        <div className="mt-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#FF6B81' }}>
                            Common mistakes
                          </p>
                          <ul className="mt-0.5 space-y-0.5">
                            {f.mistakes.map((m, j) => (
                              <li key={j} className="flex gap-1.5 text-[10.5px] leading-snug text-muted">
                                <X size={9} className="mt-0.5 shrink-0" style={{ color: '#FF6B81' }} />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  {node.examples.map((ex, i) => (
                    <div key={i} className="rounded-lg border border-[var(--line)] p-3">
                      <div className="flex items-center gap-1.5">
                        <Badge tone={ex.level === 'beginner' ? 'accent' : ex.level === 'practical' ? 'ai' : 'warn'}>{ex.level}</Badge>
                        <p className="text-[12px] font-semibold">{ex.title}</p>
                      </div>
                      <p className="mt-2 text-[11.5px] leading-relaxed">
                        <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                          Problem:{' '}
                        </span>
                        <span className="text-muted">{ex.problem}</span>
                      </p>
                      <div className="mt-1.5 rounded-md border border-[var(--line)] bg-[var(--panel2)]/40 px-2.5 py-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--mastery)' }}>
                          Solution
                        </p>
                        <div className="prose-nm mt-0.5 text-[11.5px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(ex.solution) }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'practice' && (
                <div className="space-y-3">
                  {questions.length === 0 ? (
                    <p className="text-[11.5px] text-muted">No practice questions for this concept yet.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 px-3 py-2">
                        <div className="flex items-center gap-2 text-[11px] text-muted">
                          <ListChecks size={12} />
                          {answeredCount}/{questions.length} answered
                          {submitted && (
                            <span style={{ color: 'var(--mastery)' }}>
                              · {Object.values(results).filter((r) => r.correct).length} correct
                            </span>
                          )}
                        </div>
                        <button onClick={submitAll} className="btn btn-primary h-7 !px-2.5 text-[10px]">
                          <Play size={11} /> Grade all answers
                        </button>
                      </div>

                      {questions.map((q, i) => {
                        const result = results[q.id];
                        return (
                          <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.15) }}
                            className="rounded-lg border p-3"
                            style={{
                              borderColor: result
                                ? result.correct
                                  ? 'color-mix(in srgb, var(--mastery) 45%, var(--line))'
                                  : 'rgba(255,107,129,0.45)'
                                : 'var(--line)',
                            }}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <p className="text-[11.5px] font-medium leading-snug">
                                <span className="mr-1.5 font-mono text-[10px] text-muted">Q{i + 1}</span>
                                {q.prompt}
                              </p>
                              <Badge tone="neutral" className="shrink-0">
                                {q.type}
                              </Badge>
                            </div>

                            <QuestionInput
                              question={q}
                              value={answers[q.id] ?? null}
                              onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                              disabled={Boolean(result)}
                            />

                            <div className="mt-2 flex items-center gap-1.5">
                              {!result ? (
                                <button onClick={() => submitAnswer(q.id)} className="btn btn-ghost h-6 !px-2 text-[10px]">
                                  Check answer
                                </button>
                              ) : (
                                <Badge tone={result.correct ? 'mastery' : 'danger'}>
                                  {result.correct ? <Check size={10} /> : <X size={10} />}
                                  {result.correct ? 'correct' : 'incorrect'}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted">{q.difficulty}</span>
                            </div>

                            {result && (
                              <div className="mt-2 rounded-md border border-[var(--line)] bg-[var(--panel2)]/50 px-2.5 py-1.5">
                                <p className="text-[10.5px] leading-relaxed text-muted">
                                  <span className="font-semibold text-ink">Explanation: </span>
                                  {result.explanation}
                                </p>
                                {!result.correct && (
                                  <p className="mt-0.5 text-[10.5px] text-muted">
                                    <span className="font-semibold" style={{ color: 'var(--mastery)' }}>
                                      Answer:{' '}
                                    </span>
                                    {JSON.stringify(result.correctAnswer)}
                                  </p>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {tab === 'connections' && (
                <div className="space-y-4">
                  {nodeEdges.length === 0 && <p className="text-[11.5px] text-muted">No connections recorded yet.</p>}

                  {[
                    { title: 'Prerequisites', list: prereqs, tone: 'accent' as const },
                    { title: 'Related concepts', list: related, tone: 'ai' as const },
                    { title: 'Extensions', list: extensions, tone: 'mastery' as const },
                    { title: 'Contrasts', list: contrasts, tone: 'warn' as const },
                    { title: 'Contains', list: children, tone: 'neutral' as const },
                  ]
                    .filter((g) => g.list.length > 0)
                    .map((group) => (
                      <div key={group.title}>
                        <p className="label mb-1.5">{group.title}</p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {group.list.map((n) => {
                            const p = progressMap[n.id];
                            return (
                              <button
                                key={n.id}
                                onClick={() => navigate(`/app/node/${n.id}`)}
                                className="flex items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-[var(--panel2)]/30 px-2.5 py-1.5 text-left transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))]"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-[11px]">{n.title}</span>
                                  <span className="block text-[9.5px] text-muted">
                                    {TYPE_META[n.type]?.label ?? n.type} · {p ? `${computeMastery(p)}%` : 'unexplored'}
                                  </span>
                                </span>
                                <ArrowRight size={11} className="shrink-0 text-muted" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  <div className="rounded-lg border border-[var(--line)] p-3">
                    <p className="label mb-1.5">Explicit edge records</p>
                    <ul className="space-y-1">
                      {nodeEdges.slice(0, 12).map((e) => {
                        const other = e.source === node.id ? byId.get(e.target) : byId.get(e.source);
                        return (
                          <li key={e.id} className="flex items-start gap-1.5 text-[10.5px] leading-snug text-muted">
                            <span className="mt-0.5 shrink-0 rounded px-1 font-mono text-[9px]" style={{ background: 'var(--panel2)' }}>
                              {e.source === node.id ? '→' : '←'} {e.type}
                            </span>
                            <span className="min-w-0">
                              <button onClick={() => other && navigate(`/app/node/${other.id}`)} className="font-medium text-ink hover:underline">
                                {other?.title ?? 'unknown'}
                              </button>
                              <span className="block text-[10px]">{e.explanation}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--line)] pt-2.5">
                      <select
                        value={linkTarget}
                        onChange={(e) => setLinkTarget(e.target.value)}
                        className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--panel2)] px-1.5 py-1 text-[10.5px] outline-none"
                      >
                        <option value="">Connect to another concept…</option>
                        {nodes
                          .filter((n) => n.universeId === node.universeId && n.id !== node.id)
                          .slice(0, 200)
                          .map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.title}
                            </option>
                          ))}
                      </select>
                      <button
                        disabled={!linkTarget}
                        onClick={() => {
                          const target = byId.get(linkTarget);
                          if (!target) return;
                          createEdge({
                            universeId: node.universeId,
                            source: node.id,
                            target: target.id,
                            type: 'similarity',
                            explanation: `Manually linked ${node.title} to ${target.title}.`,
                          });
                          setLinkTarget('');
                          toast({ title: 'Connection created', description: '+20 XP', tone: 'success' });
                        }}
                        className="btn btn-ghost h-7 !px-2 text-[10px]"
                      >
                        <Link2 size={11} /> Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'progress' && (
                <div className="space-y-4">
                  {!progress ? (
                    <p className="text-[11.5px] text-muted">No progress recorded yet. Read the theory or answer a question to begin.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          ['Understanding', progress.understanding],
                          ['Recall', progress.recall],
                          ['Practice', progress.practice],
                          ['Consistency', progress.consistency],
                        ].map(([label, value]) => (
                          <div key={String(label)} className="rounded-md border border-[var(--line)] bg-[var(--panel2)]/40 p-2">
                            <p className="text-[9.5px] uppercase tracking-wider text-muted">{String(label)}</p>
                            <p className="mt-0.5 font-mono text-[13px]">{Math.round(Number(value))}%</p>
                            <ProgressBar value={Number(value)} height={3} className="mt-1" />
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md border border-[var(--line)] p-2.5">
                          <p className="label mb-1">Signals</p>
                          <ul className="space-y-1 text-[10.5px] text-muted">
                            <li className="flex justify-between">
                              <span>Quiz accuracy</span>
                              <span className="font-mono">
                                {progress.quizAttempts ? percent(progress.quizCorrect, progress.quizAttempts) : 0}%
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span>Questions attempted</span>
                              <span className="font-mono">{progress.quizAttempts}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Time invested</span>
                              <span className="font-mono">{formatDuration(progress.timeSpentMs)}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Forgetting risk</span>
                              <span className="font-mono" style={{ color: forgettingRisk(progress) > 60 ? '#FFB86B' : 'var(--mastery)' }}>
                                {forgettingRisk(progress)}%
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="rounded-md border border-[var(--line)] p-2.5">
                          <p className="label mb-1">Revision schedule</p>
                          <ul className="space-y-1 text-[10.5px] text-muted">
                            <li className="flex justify-between">
                              <span>Next review</span>
                              <span className="font-mono">{progress.revisionDue ? timeAgo(progress.revisionDue) : 'not scheduled'}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Interval</span>
                              <span className="font-mono">{progress.intervalDays || 0} days</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Ease factor</span>
                              <span className="font-mono">{progress.ease.toFixed(2)}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Revisions logged</span>
                              <span className="font-mono">{progress.revisionCount}</span>
                            </li>
                          </ul>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {[1, 3, 4, 5].map((q) => (
                              <button
                                key={q}
                                onClick={() => {
                                  runRevision(node.id, q);
                                  toast({ title: `Revision logged (quality ${q}/5)`, tone: q >= 3 ? 'success' : 'warn' });
                                }}
                                className="btn btn-ghost h-6 !px-2 text-[10px]"
                              >
                                Recall {q}/5
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {progress.incorrectQuestions.length > 0 && (
                        <div>
                          <p className="label mb-1">Questions to revisit</p>
                          <ul className="space-y-0.5">
                            {progress.incorrectQuestions.map((qid) => {
                              const q = questions.find((x) => x.id === qid);
                              if (!q) return null;
                              return (
                                <li key={qid} className="truncate text-[10.5px] text-muted">
                                  · {q.prompt}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      <div>
                        <p className="label mb-1">Activity history</p>
                        <ul className="space-y-0.5">
                          {progress.history.slice(-10).reverse().map((h, i) => (
                            <li key={i} className="flex items-center justify-between gap-2 text-[10.5px] text-muted">
                              <span>
                                <span className="font-mono text-[9.5px]" style={{ color: 'var(--accent)' }}>
                                  {h.type}
                                </span>
                                {h.note ? ` · ${h.note}` : ''}
                              </span>
                              <span className="shrink-0">{timeAgo(h.at)}</span>
                            </li>
                          ))}
                          {progress.history.length === 0 && <li className="text-[10.5px] text-muted">No activity yet.</li>}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="panel p-3.5">
            <SectionTitle title="Mastery" hint={statusMeta.label} />
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold" style={{ color: statusMeta.color }}>
                {mastery}%
              </span>
              <span className="text-[10px] text-muted">{node.difficulty}</span>
            </div>
            <ProgressBar value={mastery} className="mt-1.5" tone={mastery >= 85 ? 'mastery' : mastery >= 55 ? 'accent' : 'warn'} />
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              {mastery >= 85
                ? 'Mastered. Keep it alive with scheduled revision.'
                : mastery >= 55
                  ? 'Practising. Answer more questions to consolidate.'
                  : mastery > 0
                    ? 'Learning. Complete the theory and try the practice set.'
                    : 'Unexplored. Start with the theory above.'}
            </p>
          </div>

          <div className="panel p-3.5">
            <SectionTitle title="In this branch" hint={`${children.length} direct children`} />
            {children.length === 0 ? (
              <p className="text-[10.5px] text-muted">This is a leaf concept.</p>
            ) : (
              <ul className="space-y-0.5">
                {children.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/app/node/${c.id}`)}
                      className="flex w-full items-center justify-between gap-1.5 rounded px-1.5 py-1 text-left text-[10.5px] transition-colors hover:bg-[var(--panel2)]/70"
                    >
                      <span className="truncate">{c.title}</span>
                      <ChevronRight size={10} className="shrink-0 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(orderedSiblings.prev || orderedSiblings.next) && (
            <div className="panel p-3.5">
              <SectionTitle title="Nearby concepts" />
              <div className="space-y-1">
                {orderedSiblings.prev && (
                  <button
                    onClick={() => navigate(`/app/node/${orderedSiblings.prev!.id}`)}
                    className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[10.5px] hover:bg-[var(--panel2)]/70"
                  >
                    <ArrowLeft size={10} className="shrink-0 text-muted" />
                    <span className="truncate">{orderedSiblings.prev.title}</span>
                  </button>
                )}
                {orderedSiblings.next && (
                  <button
                    onClick={() => navigate(`/app/node/${orderedSiblings.next!.id}`)}
                    className="flex w-full items-center justify-between gap-1.5 rounded px-1.5 py-1 text-left text-[10.5px] hover:bg-[var(--panel2)]/70"
                  >
                    <span className="truncate">{orderedSiblings.next.title}</span>
                    <ArrowRight size={10} className="shrink-0 text-muted" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="panel p-3.5">
            <SectionTitle title="Shortcuts" />
            <div className="grid gap-1.5">
              <Link to="/app/neural-space" className="btn btn-ghost h-7 text-[10px]">
                <Crosshair size={11} /> Show in graph
              </Link>
              <Link to="/app/exam" className="btn btn-ghost h-7 text-[10px]">
                <Target size={11} /> Test this universe
              </Link>
              <Link to="/app/revision" className="btn btn-ghost h-7 text-[10px]">
                <RefreshCw size={11} /> Revision center
              </Link>
              <Tooltip label="Ask the assistant about this concept">
                <Link to="/app/assistant" className="btn btn-ai h-7 w-full text-[10px]">
                  <Sparkles size={11} /> Ask the assistant
                </Link>
              </Tooltip>
            </div>
          </div>

          <div className="panel p-3.5">
            <SectionTitle title="Notes" hint="saved locally" />
            <textarea
              defaultValue={node.description}
              onBlur={(e) => useApp.getState().updateNode(node.id, { description: e.target.value })}
              rows={4}
              className="input resize-none text-[11px]"
              placeholder="Your own notes on this concept…"
            />
          </div>

          <div className="panel p-3.5">
            <p className="label mb-1">Legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Eye size={9} /> {progress?.firstStudied ? `first opened ${timeAgo(progress.firstStudied)}` : 'not opened yet'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Clock size={9} /> {progress ? formatDuration(progress.timeSpentMs) : '0:00'} tracked
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

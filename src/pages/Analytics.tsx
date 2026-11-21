import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Brain, Compass, Dna, Flame, Target, TrendingUp, Zap } from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, Panel, ProgressBar, SectionTitle, Stat, Tabs } from '@/components/ui';
import { computeMastery, forgettingRisk } from '@/lib/learning';
import { formatMinutes, percent, rankFor, todayKey } from '@/lib/utils';

type TabId = 'overview' | 'mastery' | 'activity' | 'exams';

const AXIS = { stroke: 'var(--muted)', fontSize: 10 };
const GRID = 'color-mix(in srgb, var(--line) 70%, transparent)';

export function Analytics() {
  const [tab, setTab] = useState<TabId>('overview');

  const universes = useApp((s) => s.universes);
  const nodes = useApp((s) => s.nodes);
  const edges = useApp((s) => s.edges);
  const progress = useApp((s) => s.progress);
  const attempts = useApp((s) => s.attempts);
  const gamification = useApp((s) => s.gamification);
  const settings = useApp((s) => s.settings);

  const progressList = useMemo(() => Object.values(progress), [progress]);
  const discovered = progressList.filter((p) => p.firstStudied);
  const mastered = progressList.filter((p) => p.status === 'mastered');
  const rank = rankFor(gamification.xp);

  const totals = useMemo(() => {
    const attemptsCount = progressList.reduce((a, p) => a + p.quizAttempts, 0);
    const correctCount = progressList.reduce((a, p) => a + p.quizCorrect, 0);
    const timeMs = progressList.reduce((a, p) => a + p.timeSpentMs, 0);
    return {
      attemptsCount,
      correctCount,
      accuracy: attemptsCount ? Math.round((correctCount / attemptsCount) * 100) : 0,
      timeMs,
      revisions: progressList.reduce((a, p) => a + p.revisionCount, 0),
      avgMastery: discovered.length ? Math.round(discovered.reduce((a, p) => a + computeMastery(p), 0) / discovered.length) : 0,
    };
  }, [progressList, discovered]);

  const activitySeries = useMemo(() => {
    const days: { day: string; label: string; xp: number; minutes: number; questions: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      const session = gamification.sessions.find((s) => s.day === key);
      const questions = progressList.reduce(
        (acc, p) => acc + p.history.filter((h) => h.type === 'quiz' && h.at.slice(0, 10) === key).length,
        0,
      );
      days.push({
        day: key,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        xp: session?.xp ?? 0,
        minutes: session?.minutes ?? 0,
        questions,
      });
    }
    return days;
  }, [gamification.sessions, progressList]);

  const masteryBuckets = useMemo(() => {
    const buckets = [
      { label: '0–19', min: 0, max: 19 },
      { label: '20–39', min: 20, max: 39 },
      { label: '40–59', min: 40, max: 59 },
      { label: '60–79', min: 60, max: 79 },
      { label: '80–100', min: 80, max: 100 },
    ];
    return buckets.map((b) => ({
      label: b.label,
      concepts: discovered.filter((p) => {
        const m = computeMastery(p);
        return m >= b.min && m <= b.max;
      }).length,
    }));
  }, [discovered]);

  const radarData = useMemo(() => {
    const avg = (key: 'understanding' | 'recall' | 'practice' | 'consistency') =>
      discovered.length ? Math.round(discovered.reduce((a, p) => a + p[key], 0) / discovered.length) : 0;
    return [
      { signal: 'Understanding', value: avg('understanding') },
      { signal: 'Recall', value: avg('recall') },
      { signal: 'Practice', value: avg('practice') },
      { signal: 'Consistency', value: avg('consistency') },
      { signal: 'Accuracy', value: totals.accuracy },
    ];
  }, [discovered, totals.accuracy]);

  const universeRows = useMemo(() => {
    return universes
      .map((u) => {
        const un = nodes.filter((n) => n.universeId === u.id);
        const explored = un.filter((n) => progress[n.id]?.firstStudied);
        const unMastered = un.filter((n) => progress[n.id]?.status === 'mastered');
        const avg = explored.length
          ? Math.round(explored.reduce((a, n) => a + computeMastery(progress[n.id]), 0) / explored.length)
          : 0;
        return {
          id: u.id,
          name: u.name,
          color: u.color,
          total: un.length,
          explored: explored.length,
          mastered: unMastered.length,
          avg,
          coverage: percent(explored.length, un.length),
        };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [universes, nodes, progress]);

  const typeRows = useMemo(() => {
    const map = new Map<string, { type: string; total: number; explored: number; mastery: number }>();
    for (const n of nodes) {
      const entry = map.get(n.type) ?? { type: n.type, total: 0, explored: 0, mastery: 0 };
      entry.total += 1;
      const p = progress[n.id];
      if (p?.firstStudied) {
        entry.explored += 1;
        entry.mastery += computeMastery(p);
      }
      map.set(n.type, entry);
    }
    return [...map.values()]
      .map((e) => ({ ...e, avg: e.explored ? Math.round(e.mastery / e.explored) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [nodes, progress]);

  const difficultyRows = useMemo(() => {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
    return levels.map((level) => {
      const list = discovered.filter((p) => p.difficulty === level);
      return {
        level,
        concepts: list.length,
        avg: list.length ? Math.round(list.reduce((a, p) => a + computeMastery(p), 0) / list.length) : 0,
      };
    });
  }, [discovered]);

  const riskRows = useMemo(
    () =>
      discovered
        .map((p) => ({ p, node: nodes.find((n) => n.id === p.nodeId), risk: forgettingRisk(p) }))
        .filter((r) => r.node)
        .sort((a, b) => b.risk - a.risk)
        .slice(0, 8),
    [discovered, nodes],
  );

  const examSeries = useMemo(
    () =>
      [...attempts]
        .slice(0, 12)
        .reverse()
        .map((a, i) => ({
          index: i + 1,
          label: a.title.length > 18 ? `${a.title.slice(0, 18)}…` : a.title,
          score: Math.round(a.score),
          correct: a.correct,
          total: a.total,
        })),
    [attempts],
  );

  const edgeTypes = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of edges) map.set(e.type, (map.get(e.type) ?? 0) + 1);
    return [...map.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  }, [edges]);

  const palette = ['#36D6FF', '#9166FF', '#2FD8B0', '#FFB86B', '#FF6B81', '#7DE2A8'];

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Intelligence</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">Knowledge Analytics</h1>
          <p className="mt-1 text-xs text-muted">Every number here is computed from your own study history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="mastery">
            <Flame size={10} /> {gamification.streak}d streak
          </Badge>
          <Badge tone="accent">
            <Zap size={10} /> {gamification.xp} XP
          </Badge>
          <Badge tone="ai">{rank.name}</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Average mastery" value={`${totals.avgMastery}%`} sub={`${mastered.length} mastered`} tone="mastery" icon={<TrendingUp size={14} />} />
        <Stat label="Accuracy" value={`${totals.accuracy}%`} sub={`${totals.correctCount}/${totals.attemptsCount} answers`} icon={<Target size={14} />} />
        <Stat label="Time invested" value={formatMinutes(totals.timeMs / 60000)} sub={`${totals.revisions} revisions`} tone="ai" icon={<Activity size={14} />} />
        <Stat label="Coverage" value={`${percent(discovered.length, nodes.length)}%`} sub={`${discovered.length} of ${nodes.length} concepts`} tone="warn" icon={<Compass size={14} />} />
      </div>

      <div className="mt-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'overview', label: 'Overview', icon: <Dna size={12} /> },
            { id: 'mastery', label: 'Mastery', icon: <Brain size={12} /> },
            { id: 'activity', label: 'Activity', icon: <Activity size={12} /> },
            { id: 'exams', label: 'Exams', icon: <Target size={12} />, count: attempts.length },
          ]}
        />
      </div>

      {discovered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Dna size={18} />}
            title="No data yet"
            description="Analytics fill in as you study. Open a concept, read the theory and answer a few questions to seed the charts."
            action={
              <Link to="/app/neural-space" className="btn btn-primary">
                Open Neural Space
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {tab === 'overview' && (
            <>
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <Panel className="p-4">
                  <SectionTitle title="Learning signals" hint="averaged across discovered concepts" />
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="72%">
                        <PolarGrid stroke={GRID} />
                        <PolarAngleAxis dataKey="signal" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 9 }} stroke={GRID} />
                        <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.28} />
                        <ReTooltip
                          contentStyle={{
                            background: 'var(--panel)',
                            border: '1px solid var(--line)',
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel className="p-4">
                  <SectionTitle title="Universe coverage" hint="explored vs total concepts" />
                  {universeRows.length === 0 ? (
                    <p className="py-6 text-center text-[11px] text-muted">No universes yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {universeRows.slice(0, 6).map((u) => (
                        <li key={u.id}>
                          <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: u.color }} />
                              <span className="truncate">{u.name}</span>
                            </span>
                            <span className="shrink-0 font-mono text-muted">
                              {u.explored}/{u.total} · {u.avg}%
                            </span>
                          </div>
                          <ProgressBar value={u.coverage} height={4} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel className="p-4">
                  <SectionTitle title="Concepts by type" hint="where your map is dense" />
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeRows} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={GRID} horizontal={false} />
                        <XAxis type="number" tick={AXIS} stroke={GRID} allowDecimals={false} />
                        <YAxis type="category" dataKey="type" tick={AXIS} stroke={GRID} width={78} />
                        <ReTooltip
                          contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11 }}
                        />
                        <Bar dataKey="total" fill="var(--accent)" fillOpacity={0.35} radius={[0, 3, 3, 0]} />
                        <Bar dataKey="explored" fill="var(--accent)" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel className="p-4">
                  <SectionTitle title="Connection types" hint={`${edges.length} edges in the graph`} />
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={edgeTypes} margin={{ left: 0, right: 8, top: 4, bottom: 24 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="type" tick={{ ...AXIS, fontSize: 9 }} stroke={GRID} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={AXIS} stroke={GRID} allowDecimals={false} />
                        <ReTooltip
                          contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11 }}
                        />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                          {edgeTypes.map((_, i) => (
                            <Cell key={i} fill={palette[i % palette.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>
            </>
          )}

          {tab === 'mastery' && (
            <>
              <Panel className="p-4">
                <SectionTitle title="Mastery distribution" hint="how many concepts sit in each band" />
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={masteryBuckets} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="label" tick={AXIS} stroke={GRID} />
                      <YAxis tick={AXIS} stroke={GRID} allowDecimals={false} />
                      <ReTooltip
                        contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11 }}
                      />
                      <Bar dataKey="concepts" radius={[3, 3, 0, 0]}>
                        {masteryBuckets.map((_, i) => (
                          <Cell key={i} fill={palette[i % palette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel className="p-4">
                  <SectionTitle title="By difficulty" hint="average mastery per tier" />
                  <div className="space-y-3">
                    {difficultyRows.map((d) => (
                      <div key={d.level}>
                        <div className="mb-1 flex justify-between text-[11px]">
                          <span className="capitalize">{d.level}</span>
                          <span className="font-mono text-muted">
                            {d.avg}% · {d.concepts} concepts
                          </span>
                        </div>
                        <ProgressBar value={d.avg} height={4} tone={d.level === 'expert' ? 'warn' : 'mastery'} />
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel className="p-4">
                  <SectionTitle title="Highest forgetting risk" hint="review these first" />
                  {riskRows.length === 0 ? (
                    <p className="py-6 text-center text-[11px] text-muted">Nothing at risk right now.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {riskRows.map((r) => (
                        <li key={r.p.nodeId}>
                          <Link
                            to={`/app/node/${r.p.nodeId}`}
                            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--panel2)]/70"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-xs">{r.node!.title}</span>
                              <span className="block text-[10px] text-muted">
                                mastery {computeMastery(r.p)}% · {r.p.revisionCount} revisions
                              </span>
                            </span>
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]"
                              style={{
                                background: r.risk > 65 ? 'rgba(255,107,129,0.14)' : 'rgba(255,184,107,0.14)',
                                color: r.risk > 65 ? '#FF8A9B' : '#FFB86B',
                              }}
                            >
                              {r.risk}%
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            </>
          )}

          {tab === 'activity' && (
            <>
              <Panel className="p-4">
                <SectionTitle title="XP over the last 14 days" hint={`daily goal ${settings.dailyGoalMinutes} minutes`} />
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activitySeries} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="label" tick={{ ...AXIS, fontSize: 9 }} stroke={GRID} interval={1} />
                      <YAxis tick={AXIS} stroke={GRID} allowDecimals={false} />
                      <ReTooltip
                        contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11 }}
                      />
                      <Area type="monotone" dataKey="xp" stroke="var(--accent)" strokeWidth={2} fill="url(#xpFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel className="p-4">
                  <SectionTitle title="Questions answered" hint="per day" />
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activitySeries} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="label" tick={{ ...AXIS, fontSize: 9 }} stroke={GRID} interval={2} />
                        <YAxis tick={AXIS} stroke={GRID} allowDecimals={false} />
                        <ReTooltip
                          contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11 }}
                        />
                        <Bar dataKey="questions" fill="var(--ai)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                <Panel className="p-4">
                  <SectionTitle title="Study minutes" hint="tracked while a concept is open" />
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activitySeries} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={GRID} vertical={false} />
                        <XAxis dataKey="label" tick={{ ...AXIS, fontSize: 9 }} stroke={GRID} interval={2} />
                        <YAxis tick={AXIS} stroke={GRID} allowDecimals={false} />
                        <ReTooltip
                          contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11 }}
                        />
                        <Line type="monotone" dataKey="minutes" stroke="var(--mastery)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>

              <Panel className="p-4">
                <SectionTitle title="Streak and rank" hint="consistency compounds" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="label">Current streak</p>
                    <p className="mt-1 font-display text-2xl font-semibold" style={{ color: 'var(--mastery)' }}>
                      {gamification.streak} <span className="text-xs font-normal text-muted">days</span>
                    </p>
                  </div>
                  <div>
                    <p className="label">Rank</p>
                    <p className="mt-1 font-display text-2xl font-semibold" style={{ color: 'var(--ai)' }}>
                      {rank.name}
                    </p>
                    <p className="text-[10px] text-muted">Level {rank.level}</p>
                  </div>
                  <div>
                    <p className="label">To next rank</p>
                    <p className="mt-1 font-display text-2xl font-semibold">{rank.remaining}</p>
                    <ProgressBar value={rank.progress} className="mt-1.5" height={4} />
                  </div>
                </div>
              </Panel>
            </>
          )}

          {tab === 'exams' && (
            <>
              {attempts.length === 0 ? (
                <EmptyState
                  icon={<Target size={18} />}
                  title="No exams taken"
                  description="Run a test in the Exam Arena to build a score history."
                  action={
                    <Link to="/app/exam" className="btn btn-primary">
                      Open Exam Arena
                    </Link>
                  }
                />
              ) : (
                <>
                  <Panel className="p-4">
                    <SectionTitle title="Score trend" hint="most recent 12 attempts" />
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={examSeries} margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
                          <CartesianGrid stroke={GRID} vertical={false} />
                          <XAxis dataKey="index" tick={AXIS} stroke={GRID} />
                          <YAxis domain={[0, 100]} tick={AXIS} stroke={GRID} unit="%" />
                          <ReTooltip
                            contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11 }}
                          />
                          <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Panel>

                  <Panel className="overflow-hidden">
                    <div className="border-b border-[var(--line)] px-4 py-2.5">
                      <SectionTitle title="Attempt history" hint={`${attempts.length} saved attempts`} className="!mb-0" />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-wider text-muted">
                            <th className="px-4 py-2 font-medium">Test</th>
                            <th className="px-3 py-2 font-medium">Mode</th>
                            <th className="px-3 py-2 text-right font-medium">Score</th>
                            <th className="px-3 py-2 text-right font-medium">Time</th>
                            <th className="px-4 py-2 text-right font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attempts.slice(0, 20).map((a) => (
                            <tr key={a.id} className="border-b border-[var(--line)] last:border-0">
                              <td className="max-w-[220px] truncate px-4 py-2">{a.title}</td>
                              <td className="px-3 py-2 capitalize text-muted">{a.mode}</td>
                              <td className="px-3 py-2 text-right">
                                <span
                                  className="font-mono"
                                  style={{
                                    color: a.score >= 80 ? 'var(--mastery)' : a.score >= 50 ? 'var(--accent)' : '#FF8A9B',
                                  }}
                                >
                                  {Math.round(a.score)}%
                                </span>
                                <span className="ml-1 text-[10px] text-muted">
                                  {a.correct}/{a.total}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-muted">{formatMinutes(a.durationMs / 60000)}</td>
                              <td className="px-4 py-2 text-right text-muted">{new Date(a.finishedAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

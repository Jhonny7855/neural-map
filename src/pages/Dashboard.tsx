import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenCheck,
  Compass,
  Flame,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
  Waypoints,
  Zap,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, ProgressBar, SectionTitle, Stat } from '@/components/ui';
import { QUESTS, computeMastery, forgettingRisk, isDue, isOverdue } from '@/lib/learning';
import { formatMinutes, percent, rankFor, timeAgo, todayKey } from '@/lib/utils';

export function Dashboard() {
  const universes = useApp((s) => s.universes);
  const nodes = useApp((s) => s.nodes);
  const progress = useApp((s) => s.progress);
  const history = useApp((s) => s.history);
  const gamification = useApp((s) => s.gamification);
  const paths = useApp((s) => s.paths);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const settings = useApp((s) => s.settings);
  const questProgress = useApp((s) => s.questProgress);
  const claimQuest = useApp((s) => s.claimQuest);
  const setActiveUniverse = useApp((s) => s.setActiveUniverse);

  const activeUniverse = universes.find((u) => u.id === activeUniverseId) ?? universes[0];
  const universeNodes = useMemo(
    () => (activeUniverse ? nodes.filter((n) => n.universeId === activeUniverse.id) : []),
    [nodes, activeUniverse],
  );
  const progressList = useMemo(() => Object.values(progress), [progress]);
  const rank = rankFor(gamification.xp);

  const dueList = useMemo(
    () => progressList.filter((p) => p.firstStudied && isDue(p) && !isOverdue(p)).sort((a, b) => (a.revisionDue ?? '').localeCompare(b.revisionDue ?? '')),
    [progressList],
  );
  const overdueList = useMemo(() => progressList.filter((p) => isOverdue(p)), [progressList]);
  const weak = useMemo(
    () =>
      progressList
        .filter((p) => p.firstStudied && computeMastery(p) < 55)
        .sort((a, b) => forgettingRisk(b) - forgettingRisk(a))
        .slice(0, 5),
    [progressList],
  );
  const mastered = progressList.filter((p) => p.status === 'mastered').length;
  const discovered = progressList.filter((p) => p.firstStudied).length;
  const activePath = paths.find((p) => p.active);
  const nextStep = activePath?.steps.find((s) => !s.completed && !s.skipped);
  const nextNode = nextStep ? nodes.find((n) => n.id === nextStep.nodeId) : null;

  const todayMinutes = useMemo(() => {
    const ms = progressList.reduce((acc, p) => {
      const todays = p.history.filter((h) => h.at.slice(0, 10) === todayKey());
      return acc + todays.length * 60_000;
    }, 0);
    return Math.round(ms / 60_000);
  }, [progressList]);

  const recentNodes = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; at: string; universeId?: string }[] = [];
    for (const h of history) {
      if (h.kind !== 'node-open' || !h.nodeId || seen.has(h.nodeId)) continue;
      seen.add(h.nodeId);
      out.push({ id: h.nodeId, at: h.at, universeId: h.universeId });
      if (out.length >= 6) break;
    }
    return out.map((r) => ({ ...r, node: nodes.find((n) => n.id === r.id) })).filter((r) => r.node);
  }, [history, nodes]);

  const recommended = useMemo(() => {
    const unexplored = universeNodes.filter((n) => !progress[n.id]?.firstStudied).slice(0, 4);
    return unexplored;
  }, [universeNodes, progress]);

  const activeQuests = QUESTS.slice(0, 4).map((q) => ({ ...q, progress: questProgress(q.id) }));

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Welcome back</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {settings.profile.name}
          </h1>
          <p className="mt-1 text-xs text-muted">{settings.profile.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="mastery">
            <Flame size={10} /> {gamification.streak} day streak
          </Badge>
          <Badge tone="accent">
            <Zap size={10} /> {gamification.xp} XP
          </Badge>
          <Badge tone="ai">{rank.name}</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Concepts discovered" value={discovered} sub={`of ${nodes.length} total`} icon={<Compass size={14} />} />
        <Stat label="Mastered" value={mastered} sub={`${percent(mastered, Math.max(1, discovered))}% of discovered`} tone="mastery" icon={<TrendingUp size={14} />} />
        <Stat label="Due for revision" value={dueList.length + overdueList.length} sub={overdueList.length ? `${overdueList.length} overdue` : 'on schedule'} tone="warn" icon={<BookOpenCheck size={14} />} />
        <Stat label="Today" value={`${todayMinutes}m`} sub={`goal ${settings.dailyGoalMinutes}m`} icon={<Target size={14} />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Layers size={13} className="text-[var(--accent)]" />
                <h3 className="text-sm font-semibold">Continue learning</h3>
              </div>
              <Link to="/app/neural-space" className="text-[11px] text-[var(--accent)] hover:underline">
                open graph
              </Link>
            </div>
            <div className="p-4">
              {activeUniverse ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{activeUniverse.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">{activeUniverse.description}</p>
                    </div>
                    <Badge tone="accent">{activeUniverse.tags[0] ?? 'universe'}</Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                    <span>{universeNodes.length} concepts</span>
                    <span className="opacity-40">·</span>
                    <span>{percent(universeNodes.filter((n) => progress[n.id]?.firstStudied).length, universeNodes.length)}% explored</span>
                  </div>
                  <ProgressBar
                    className="mt-2"
                    value={percent(universeNodes.filter((n) => progress[n.id]?.firstStudied).length, universeNodes.length)}
                  />

                  {nextNode ? (
                    <Link
                      to={`/app/node/${nextNode.id}`}
                      onClick={() => setActiveUniverse(nextNode.universeId)}
                      className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/50 p-3 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))]"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-muted">Next in path</p>
                        <p className="mt-0.5 truncate text-xs font-medium">{nextNode.title}</p>
                      </div>
                      <ArrowRight size={14} className="shrink-0 text-[var(--accent)]" />
                    </Link>
                  ) : (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {recommended.length === 0 ? (
                        <p className="text-[11px] text-muted">You have explored every concept in this universe.</p>
                      ) : (
                        recommended.slice(0, 2).map((n) => (
                          <Link
                            key={n.id}
                            to={`/app/node/${n.id}`}
                            className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/50 p-2.5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))]"
                          >
                            <p className="text-[10px] uppercase tracking-widest text-muted">Explore next</p>
                            <p className="mt-0.5 truncate text-xs font-medium">{n.title}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={<Compass size={18} />}
                  title="No universe yet"
                  description="Create your first knowledge universe to start mapping concepts."
                  action={<Link to="/app/universes" className="btn btn-primary">Create a universe</Link>}
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="panel p-4">
              <SectionTitle
                title="Today's revision"
                hint={`${dueList.length} due · ${overdueList.length} overdue`}
                right={<Link to="/app/revision" className="text-[11px] text-[var(--accent)] hover:underline">open</Link>}
              />
              {dueList.length + overdueList.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-muted">Nothing scheduled. Study a concept to start the schedule.</p>
              ) : (
                <ul className="space-y-1.5">
                  {[...overdueList, ...dueList].slice(0, 4).map((p) => {
                    const node = nodes.find((n) => n.id === p.nodeId);
                    if (!node) return null;
                    return (
                      <li key={p.nodeId}>
                        <Link
                          to={`/app/node/${node.id}`}
                          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-[var(--panel2)]/70"
                        >
                          <span className="truncate">{node.title}</span>
                          <span className="shrink-0 text-[10px]" style={{ color: isOverdue(p) ? '#FF6B81' : '#FFB86B' }}>
                            {isOverdue(p) ? 'overdue' : 'due'}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="panel p-4">
              <SectionTitle title="Weak concepts" hint="highest forgetting risk" right={<Link to="/app/analytics" className="text-[11px] text-[var(--accent)] hover:underline">analytics</Link>} />
              {weak.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-muted">No weak concepts detected yet. Take a test to calibrate.</p>
              ) : (
                <ul className="space-y-1.5">
                  {weak.slice(0, 4).map((p) => {
                    const node = nodes.find((n) => n.id === p.nodeId);
                    if (!node) return null;
                    return (
                      <li key={p.nodeId}>
                        <Link to={`/app/node/${node.id}`} className="block rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--panel2)]/70">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs">{node.title}</span>
                            <span className="shrink-0 font-mono text-[10px] text-muted">{computeMastery(p)}%</span>
                          </div>
                          <ProgressBar value={computeMastery(p)} height={3} className="mt-1" tone="warn" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="panel p-4">
            <SectionTitle title="Active quests" hint="earn XP for real learning" />
            <div className="grid gap-2 sm:grid-cols-2">
              {activeQuests.map((q) => {
                const claimed = Boolean(useApp.getState().gamification.claimedQuests[q.id]);
                return (
                  <div key={q.id} className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{q.title}</p>
                        <p className="mt-0.5 text-[10px] text-muted">{q.description}</p>
                      </div>
                      <Badge tone={claimed ? 'mastery' : 'accent'}>{claimed ? 'claimed' : `+${q.rewardXp}`}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={percent(q.progress.current, q.progress.target)} height={4} tone={claimed ? 'mastery' : 'accent'} />
                      <span className="shrink-0 font-mono text-[10px] text-muted">
                        {Math.min(q.progress.current, q.progress.target)}/{q.progress.target}
                      </span>
                    </div>
                    {q.progress.complete && !claimed && (
                      <button onClick={() => claimQuest(q.id)} className="btn btn-primary mt-2 h-6 w-full !px-2 text-[10px]">
                        Claim reward
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <SectionTitle title="Progress" hint={rank.name} />
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold" style={{ color: 'var(--accent)' }}>
                {gamification.xp} <span className="text-xs font-normal text-muted">XP</span>
              </span>
              <span className="text-[11px] text-muted">Level {rank.level}</span>
            </div>
            <ProgressBar value={rank.progress} className="mt-2" />
            <p className="mt-1.5 text-[10px] text-muted">
              {rank.remaining} XP to {rank.next ?? 'maximum rank'}
            </p>

            <div className="mt-4 space-y-2">
              {[
                ['Discoveries', discovered, nodes.length],
                ['Mastery', mastered, Math.max(1, discovered)],
                ['Revision done', progressList.reduce((a, p) => a + p.revisionCount, 0), Math.max(1, discovered)],
              ].map(([label, value, total]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex justify-between text-[10px] text-muted">
                    <span>{label}</span>
                    <span className="font-mono">{value}/{total}</span>
                  </div>
                  <ProgressBar value={percent(Number(value), Number(total))} height={3} />
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <SectionTitle title="Recently explored" />
            {recentNodes.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-muted">Nothing opened yet. Start in the Neural Space.</p>
            ) : (
              <ul className="space-y-1">
                {recentNodes.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/app/node/${r.id}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-[var(--panel2)]/70"
                    >
                      <span className="truncate">{r.node!.title}</span>
                      <span className="shrink-0 text-[10px] text-muted">{timeAgo(r.at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-4">
            <SectionTitle title="My universes" right={<Link to="/app/universes" className="text-[11px] text-[var(--accent)] hover:underline">manage</Link>} />
            {universes.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-muted">No universes yet.</p>
            ) : (
              <ul className="space-y-1">
                {universes.slice(0, 5).map((u) => {
                  const un = nodes.filter((n) => n.universeId === u.id);
                  const explored = un.filter((n) => progress[n.id]?.firstStudied).length;
                  return (
                    <li key={u.id}>
                      <Link
                        to="/app/neural-space"
                        onClick={() => setActiveUniverse(u.id)}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-[var(--panel2)]/70"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: u.color }} />
                          <span className="truncate">{u.name}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted">{explored}/{un.length}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="panel p-4">
            <SectionTitle title="Recommended discoveries" hint="based on your gaps" />
            {recommended.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-muted">You have explored the current universe fully.</p>
            ) : (
              <ul className="space-y-1.5">
                {recommended.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={`/app/node/${n.id}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--panel2)]/70"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs">{n.title}</span>
                        <span className="block truncate text-[10px] text-muted">{n.type} · {n.difficulty}</span>
                      </span>
                      <Sparkles size={12} className="shrink-0" style={{ color: 'var(--ai)' }} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-4">
            <SectionTitle title="Quick actions" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/app/neural-space', label: 'Neural Space', icon: Waypoints },
                { to: '/app/exam', label: 'Take a test', icon: Target },
                { to: '/app/lab', label: 'Mind Lab', icon: Sparkles },
                { to: '/app/import', label: 'Import', icon: Layers },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="btn btn-ghost h-auto flex-col gap-1.5 py-2.5 text-[10px]">
                  <a.icon size={14} />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activePath && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel mt-4 p-4">
          <SectionTitle
            title={`Active path: ${activePath.title}`}
            hint={`${activePath.steps.filter((s) => s.completed).length}/${activePath.steps.length} steps · ${formatMinutes(activePath.minutesPerDay)}/day`}
            right={<Link to="/app/paths" className="text-[11px] text-[var(--accent)] hover:underline">manage</Link>}
          />
          <ProgressBar value={percent(activePath.steps.filter((s) => s.completed).length, activePath.steps.length)} />
        </motion.div>
      )}
    </div>
  );
}

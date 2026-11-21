import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpenCheck,
  Check,
  Compass,
  Flame,
  History,
  Layers,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, Panel, ProgressBar, SectionTitle, Stat, Tabs } from '@/components/ui';
import { ACHIEVEMENTS, QUESTS, computeMastery } from '@/lib/learning';
import { formatMinutes, percent, rankFor, timeAgo } from '@/lib/utils';

type TabId = 'overview' | 'achievements' | 'quests' | 'history';

const TIER_TONE: Record<string, 'warn' | 'neutral' | 'mastery' | 'ai'> = {
  bronze: 'warn',
  silver: 'neutral',
  gold: 'mastery',
  neural: 'ai',
};

const HISTORY_ICON: Record<string, typeof Compass> = {
  'node-open': Compass,
  'branch-expand': Layers,
  test: Target,
  connection: TrendingUp,
  universe: Layers,
  session: Flame,
  revision: BookOpenCheck,
  import: Layers,
  path: Compass,
};

export function Profile() {
  const [tab, setTab] = useState<TabId>('overview');
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [editing, setEditing] = useState(false);

  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const gamification = useApp((s) => s.gamification);
  const achievements = useApp((s) => s.achievements);
  const history = useApp((s) => s.history);
  const nodes = useApp((s) => s.nodes);
  const progress = useApp((s) => s.progress);
  const universes = useApp((s) => s.universes);
  const attempts = useApp((s) => s.attempts);
  const paths = useApp((s) => s.paths);
  const questProgress = useApp((s) => s.questProgress);
  const claimQuest = useApp((s) => s.claimQuest);

  const progressList = useMemo(() => Object.values(progress), [progress]);
  const discovered = progressList.filter((p) => p.firstStudied);
  const mastered = progressList.filter((p) => p.status === 'mastered');
  const rank = rankFor(gamification.xp);
  const unlockedIds = new Set(achievements.map((a) => a.achievementId));
  const totalMinutes = Math.round(progressList.reduce((a, p) => a + p.timeSpentMs, 0) / 60000);

  const save = () => {
    updateSettings({ profile: { name: name.trim() || 'Explorer', tagline: tagline.trim() } });
    setEditing(false);
  };

  const recentHistory = useMemo(() => history.slice(0, 40), [history]);

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-5 sm:py-6">
      <Panel className="relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: 'radial-gradient(600px 200px at 10% 0%, rgba(54,214,255,0.12), transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-display text-xl font-bold"
            style={{ background: 'linear-gradient(135deg, rgba(54,214,255,0.28), rgba(145,102,255,0.28))' }}
          >
            {settings.profile.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="max-w-sm space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={settings.profile.name}
                  className="input h-8 text-xs"
                  aria-label="Display name"
                />
                <input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder={settings.profile.tagline}
                  className="input h-8 text-xs"
                  aria-label="Tagline"
                />
                <div className="flex gap-2">
                  <button onClick={save} className="btn btn-primary h-7 text-[11px]">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="btn btn-ghost h-7 text-[11px]">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-xl font-semibold tracking-tight">{settings.profile.name}</h1>
                <p className="mt-0.5 text-xs text-muted">{settings.profile.tagline}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone="ai">
                    <Sparkles size={9} /> {rank.name}
                  </Badge>
                  <Badge tone="mastery">
                    <Flame size={9} /> {gamification.streak} day streak
                  </Badge>
                  <Badge tone="accent">
                    <Zap size={9} /> {gamification.xp} XP
                  </Badge>
                  <button
                    onClick={() => {
                      setName(settings.profile.name);
                      setTagline(settings.profile.tagline);
                      setEditing(true);
                    }}
                    className="text-[10px] text-[var(--accent)] hover:underline"
                  >
                    edit profile
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="w-full max-w-[220px]">
            <div className="mb-1 flex justify-between text-[10px] text-muted">
              <span>Level {rank.level}</span>
              <span>{rank.remaining} XP to {rank.next ?? 'max'}</span>
            </div>
            <ProgressBar value={rank.progress} />
          </div>
        </div>
      </Panel>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Concepts discovered" value={discovered.length} sub={`of ${nodes.length}`} icon={<Compass size={14} />} />
        <Stat label="Mastered" value={mastered.length} sub={`${percent(mastered.length, Math.max(1, discovered.length))}% of explored`} tone="mastery" icon={<TrendingUp size={14} />} />
        <Stat label="Time studied" value={formatMinutes(totalMinutes)} sub={`${progressList.reduce((a, p) => a + p.revisionCount, 0)} revisions`} tone="ai" icon={<BookOpenCheck size={14} />} />
        <Stat label="Achievements" value={`${unlockedIds.size}/${ACHIEVEMENTS.length}`} sub={`${attempts.length} tests taken`} tone="warn" icon={<Award size={14} />} />
      </div>

      <div className="mt-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'overview', label: 'Overview', icon: <Compass size={12} /> },
            { id: 'achievements', label: 'Achievements', icon: <Award size={12} />, count: unlockedIds.size },
            { id: 'quests', label: 'Quests', icon: <Target size={12} /> },
            { id: 'history', label: 'History', icon: <History size={12} />, count: history.length },
          ]}
        />
      </div>

      <div className="mt-4 space-y-4">
        {tab === 'overview' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="p-4">
              <SectionTitle title="Universes" hint="your exploration footprint" />
              {universes.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-muted">No universes yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {universes.map((u) => {
                    const un = nodes.filter((n) => n.universeId === u.id);
                    const explored = un.filter((n) => progress[n.id]?.firstStudied).length;
                    const avg = explored
                      ? Math.round(un.filter((n) => progress[n.id]?.firstStudied).reduce((a, n) => a + computeMastery(progress[n.id]), 0) / explored)
                      : 0;
                    return (
                      <li key={u.id}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                          <Link to="/app/universes" className="flex min-w-0 items-center gap-1.5 hover:text-[var(--accent)]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: u.color }} />
                            <span className="truncate">{u.name}</span>
                          </Link>
                          <span className="shrink-0 font-mono text-muted">
                            {explored}/{un.length} · {avg}%
                          </span>
                        </div>
                        <ProgressBar value={percent(explored, un.length)} height={4} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <div className="space-y-4">
              <Panel className="p-4">
                <SectionTitle title="Streak" hint="days in a row with activity" />
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'color-mix(in srgb, var(--mastery) 16%, transparent)' }}
                  >
                    <Flame size={22} style={{ color: 'var(--mastery)' }} />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-semibold" style={{ color: 'var(--mastery)' }}>
                      {gamification.streak}
                    </p>
                    <p className="text-[10px] text-muted">
                      last active {gamification.lastActiveDay ? timeAgo(`${gamification.lastActiveDay}T12:00:00Z`) : 'never'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-1">
                  {gamification.sessions.slice(-14).map((s) => (
                    <span
                      key={s.day}
                      title={`${s.day}: ${s.xp} XP`}
                      className="h-6 flex-1 rounded-sm"
                      style={{ background: s.xp > 0 ? 'var(--mastery)' : 'var(--panel2)', opacity: s.xp > 0 ? 0.75 : 1 }}
                    />
                  ))}
                </div>
              </Panel>

              <Panel className="p-4">
                <SectionTitle title="Learning paths" hint={`${paths.filter((p) => p.active).length} active`} />
                {paths.length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-muted">
                    No paths yet. <Link to="/app/paths" className="text-[var(--accent)] hover:underline">Generate one</Link>
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {paths.slice(0, 3).map((p) => {
                      const done = p.steps.filter((s) => s.completed).length;
                      return (
                        <li key={p.id}>
                          <div className="mb-1 flex justify-between text-[11px]">
                            <span className="truncate">{p.title}</span>
                            <span className="shrink-0 font-mono text-muted">
                              {done}/{p.steps.length}
                            </span>
                          </div>
                          <ProgressBar value={percent(done, p.steps.length)} height={3} tone={p.active ? 'accent' : 'mastery'} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        )}

        {tab === 'achievements' && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedIds.has(a.id);
              const record = achievements.find((x) => x.achievementId === a.id);
              return (
                <div
                  key={a.id}
                  className="rounded-lg border p-3 transition-colors"
                  style={{
                    borderColor: unlocked ? 'color-mix(in srgb, var(--mastery) 40%, var(--line))' : 'var(--line)',
                    background: unlocked ? 'color-mix(in srgb, var(--mastery) 6%, transparent)' : 'var(--panel)',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: unlocked ? 'color-mix(in srgb, var(--mastery) 18%, transparent)' : 'var(--panel2)',
                        color: unlocked ? 'var(--mastery)' : 'var(--muted)',
                      }}
                    >
                      {unlocked ? <Award size={14} /> : <Lock size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-medium">{a.title}</p>
                        <Badge tone={TIER_TONE[a.tier] ?? 'neutral'}>{a.tier}</Badge>
                      </div>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{a.description}</p>
                      <p className="mt-1 text-[10px]" style={{ color: unlocked ? 'var(--mastery)' : 'var(--muted)' }}>
                        {unlocked && record ? `unlocked ${timeAgo(record.unlockedAt)}` : 'locked'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'quests' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {QUESTS.map((q) => {
              const p = questProgress(q.id);
              const claimed = Boolean(gamification.claimedQuests[q.id]);
              return (
                <Panel key={q.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{q.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted">{q.description}</p>
                    </div>
                    <Badge tone={claimed ? 'mastery' : p.complete ? 'accent' : 'neutral'}>
                      {claimed ? <Check size={9} /> : null} {claimed ? 'claimed' : `+${q.rewardXp} XP`}
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <ProgressBar value={percent(p.current, p.target)} height={5} tone={claimed ? 'mastery' : 'accent'} />
                    <span className="shrink-0 font-mono text-[10px] text-muted">
                      {Math.min(p.current, p.target)}/{p.target}
                    </span>
                  </div>
                  {p.complete && !claimed && (
                    <button onClick={() => claimQuest(q.id)} className="btn btn-primary mt-2.5 h-7 w-full text-[11px]">
                      Claim {q.rewardXp} XP
                    </button>
                  )}
                </Panel>
              );
            })}
          </div>
        )}

        {tab === 'history' && (
          <Panel className="overflow-hidden">
            <div className="border-b border-[var(--line)] px-4 py-2.5">
              <SectionTitle title="Activity history" hint={`${history.length} events recorded`} className="!mb-0" />
            </div>
            {recentHistory.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={<History size={18} />} title="Nothing recorded yet" description="Open a concept or run a test and your activity will appear here." />
              </div>
            ) : (
              <ul className="divide-y divide-[var(--line)]">
                {recentHistory.map((h) => {
                  const Icon = HISTORY_ICON[h.kind] ?? Compass;
                  const node = h.nodeId ? nodes.find((n) => n.id === h.nodeId) : null;
                  const body = (
                    <>
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel2)]">
                        <Icon size={11} className="text-muted" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px]">{h.label}</span>
                        <span className="block text-[10px] text-muted">
                          {h.kind} · {timeAgo(h.at)}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={h.id}>
                      {node ? (
                        <Link to={`/app/node/${node.id}`} className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-[var(--panel2)]/60">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2.5 px-4 py-2">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

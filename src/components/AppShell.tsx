import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Award,
  Bell,
  BookOpenCheck,
  BrainCircuit,
  ChevronRight,
  Command,
  Compass,
  Dna,
  FlaskConical,
  Focus,
  Home,
  LayoutDashboard,
  Menu,
  Moon,
  Route,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Target,
  Upload,
  User,
  Waypoints,
  X,
  Zap,
} from 'lucide-react';
import { cn, rankFor, todayKey } from '@/lib/utils';
import { useApp } from '@/store/app';
import { isDue } from '@/lib/learning';
import { Badge, ProgressBar, Tooltip } from '@/components/ui';
import { CommandPalette } from '@/components/CommandPalette';

const NAV = [
  { group: 'Explore', items: [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/neural-space', label: 'Neural Space', icon: Waypoints },
    { to: '/app/universes', label: 'Universes', icon: Compass },
    { to: '/app/search', label: 'Search', icon: Search },
  ]},
  { group: 'Learn', items: [
    { to: '/app/paths', label: 'Learning Paths', icon: Route },
    { to: '/app/lab', label: 'Mind Lab', icon: FlaskConical },
    { to: '/app/exam', label: 'Exam Arena', icon: Target },
    { to: '/app/revision', label: 'Revision Center', icon: BookOpenCheck },
  ]},
  { group: 'Intelligence', items: [
    { to: '/app/connections', label: 'Connection Engine', icon: Activity },
    { to: '/app/analytics', label: 'Knowledge Analytics', icon: Dna },
    { to: '/app/assistant', label: 'AI Assistant', icon: Sparkles },
  ]},
  { group: 'System', items: [
    { to: '/app/import', label: 'Import Center', icon: Upload },
    { to: '/app/profile', label: 'Profile', icon: User },
    { to: '/app/settings', label: 'Settings', icon: SettingsIcon },
  ]},
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const gamification = useApp((s) => s.gamification);
  const universes = useApp((s) => s.universes);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const progress = useApp((s) => s.progress);
  const paths = useApp((s) => s.paths);
  const focusMode = useApp((s) => s.focusMode);

  const activeUniverse = universes.find((u) => u.id === activeUniverseId) ?? null;
  const rank = rankFor(gamification.xp);

  const dueCount = useMemo(
    () => Object.values(progress).filter((p) => p.firstStudied && isDue(p)).length,
    [progress],
  );

  const notifications = useMemo(() => {
    const items: { title: string; body: string; to: string; tone: 'accent' | 'warn' | 'mastery' }[] = [];
    if (dueCount) items.push({ title: 'Revision due', body: `${dueCount} concepts need review today`, to: '/app/revision', tone: 'warn' });
    const activePath = paths.find((p) => p.active);
    if (activePath) {
      const next = activePath.steps.find((s) => !s.completed && !s.skipped);
      if (next) items.push({ title: 'Learning path', body: `${activePath.title} has steps remaining`, to: '/app/paths', tone: 'accent' });
    }
    if (gamification.streak > 0) items.push({ title: 'Streak active', body: `${gamification.streak} day${gamification.streak === 1 ? '' : 's'} in a row`, to: '/app/profile', tone: 'mastery' });
    return items;
  }, [dueCount, paths, gamification.streak]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setMobileOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    const order = ['neural-dark', 'deep-space', 'midnight', 'light'] as const;
    const idx = order.indexOf(settings.theme);
    updateSettings({ theme: order[(idx + 1) % order.length] });
  };

  if (focusMode) {
    return (
      <div className="min-h-screen">
        {children}
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[236px] flex-col border-r border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur transition-transform duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/app" className="group flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)]" style={{ background: 'linear-gradient(135deg, rgba(54,214,255,0.18), rgba(145,102,255,0.16))' }}>
              <BrainCircuit size={16} className="text-[var(--accent)]" />
              <span className="absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100" style={{ boxShadow: '0 0 22px -4px var(--accent)' }} />
            </div>
            <div className="leading-tight">
              <p className="font-display text-[13px] font-semibold tracking-tight">NEURAL MAP</p>
              <p className="text-[10px] text-muted">Living Knowledge Engine</p>
            </div>
          </Link>
          <button className="text-muted lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={16} />
          </button>
        </div>

        <div className="mx-3 mb-3 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/60 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Universe</span>
            <Link to="/app/universes" className="text-[10px] text-[var(--accent)] hover:underline">
              switch
            </Link>
          </div>
          <p className="mt-1 truncate text-xs font-medium">{activeUniverse?.name ?? 'No universe'}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Badge tone="accent">
              <Zap size={9} /> {gamification.xp} XP
            </Badge>
            <Badge tone="mastery">Lv {rank.level}</Badge>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV.map((group) => (
            <div key={group.group} className="mb-3">
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
                {group.group}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  className={({ isActive }) =>
                    cn(
                      'group relative mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                      isActive ? 'text-ink' : 'text-muted hover:bg-[var(--panel2)]/60 hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <item.icon size={14} className={cn('relative shrink-0', isActive && 'text-[var(--accent)]')} />
                      <span className="relative flex-1">{item.label}</span>
                      {item.to === '/app/revision' && dueCount > 0 && (
                        <span className="relative rounded px-1 font-mono text-[10px]" style={{ background: 'rgba(255,184,107,0.18)', color: '#FFB86B' }}>
                          {dueCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--line)] px-3 py-3">
          <div className="mb-2 flex items-center justify-between text-[10px] text-muted">
            <span>{rank.name}</span>
            <span>{rank.remaining} XP to {rank.next ?? 'max'}</span>
          </div>
          <ProgressBar value={rank.progress} height={4} />
          <div className="mt-3 flex items-center gap-1">
            <Tooltip label={`Theme: ${settings.theme}`}>
              <button className="btn btn-ghost h-7 w-7 !px-0" onClick={toggleTheme} aria-label="Cycle theme">
                {settings.theme === 'light' ? <Sun size={13} /> : <Moon size={13} />}
              </button>
            </Tooltip>
            <Tooltip label="Focus mode">
              <button className="btn btn-ghost h-7 w-7 !px-0" onClick={() => useApp.getState().toggleFocusMode(true)} aria-label="Enter focus mode">
                <Focus size={13} />
              </button>
            </Tooltip>
            <Tooltip label="Command palette (Ctrl+K)">
              <button className="btn btn-ghost h-7 w-7 !px-0" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
                <Command size={13} />
              </button>
            </Tooltip>
            <div className="flex-1" />
            <Link to="/app/profile" className="flex h-7 items-center gap-1.5 rounded-lg border border-[var(--line)] px-2 text-[10px] text-muted hover:text-ink">
              <Award size={11} />
              {useApp.getState().achievements.length}
            </Link>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)]/85 px-3 backdrop-blur-md sm:px-4">
          <button className="btn btn-ghost h-8 w-8 !px-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={15} />
          </button>

          <Breadcrumbs />

          <div className="flex-1" />

          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden h-8 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/60 px-2.5 text-[11px] text-muted transition-colors hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] hover:text-ink sm:flex"
          >
            <Search size={12} />
            Search concepts
            <span className="kbd ml-2">Ctrl K</span>
          </button>
          <button className="btn btn-ghost h-8 w-8 !px-0 sm:hidden" onClick={() => setPaletteOpen(true)} aria-label="Search">
            <Search size={15} />
          </button>

          <div className="relative">
            <button
              className="btn btn-ghost relative h-8 w-8 !px-0"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
            >
              <Bell size={15} />
              {notifications.length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-[min(88vw,300px)] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-panel"
                >
                  <div className="border-b border-[var(--line)] px-3 py-2 text-[11px] font-semibold">Notifications</div>
                  {notifications.length === 0 ? (
                    <p className="px-3 py-6 text-center text-[11px] text-muted">You're all caught up.</p>
                  ) : (
                    notifications.map((n, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setNotifOpen(false);
                          navigate(n.to);
                        }}
                        className="flex w-full items-start gap-2 border-b border-[var(--line)] px-3 py-2.5 text-left last:border-0 hover:bg-[var(--panel2)]/60"
                      >
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: n.tone === 'warn' ? '#FFB86B' : n.tone === 'mastery' ? 'var(--mastery)' : 'var(--accent)' }} />
                        <span className="min-w-0">
                          <span className="block text-[11px] font-medium">{n.title}</span>
                          <span className="block text-[10px] text-muted">{n.body}</span>
                        </span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/app/profile" className="flex items-center gap-2 rounded-lg border border-[var(--line)] py-1 pl-1 pr-2.5 hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))]">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md font-display text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg, rgba(54,214,255,0.28), rgba(145,102,255,0.28))', color: 'var(--ink)' }}
            >
              {settings.profile.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden text-[11px] font-medium sm:block">{settings.profile.name}</span>
          </Link>
        </header>

        <main className="min-w-0 flex-1">{children}</main>

        <nav className="sticky bottom-0 z-30 flex items-center justify-around border-t border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur md:hidden">
          {[
            { to: '/app', icon: Home, label: 'Home' },
            { to: '/app/neural-space', icon: Waypoints, label: 'Space' },
            { to: '/app/exam', icon: Target, label: 'Exam' },
            { to: '/app/revision', icon: BookOpenCheck, label: 'Revise' },
            { to: '/app/assistant', icon: Sparkles, label: 'AI' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={({ isActive }) =>
                cn('flex flex-1 flex-col items-center gap-1 py-2 text-[9px]', isActive ? 'text-[var(--accent)]' : 'text-muted')
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function Breadcrumbs() {
  const location = useLocation();
  const universes = useApp((s) => s.universes);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const activeUniverse = universes.find((u) => u.id === activeUniverseId);

  const segments = location.pathname.split('/').filter(Boolean).slice(1);
  const labelMap: Record<string, string> = {
    'neural-space': 'Neural Space',
    universes: 'Universes',
    import: 'Import Center',
    paths: 'Learning Paths',
    lab: 'Mind Lab',
    exam: 'Exam Arena',
    connections: 'Connection Engine',
    revision: 'Revision Center',
    analytics: 'Knowledge Analytics',
    assistant: 'AI Assistant',
    settings: 'Settings',
    profile: 'Profile',
    search: 'Search',
    node: 'Node',
  };

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
      <Link to="/app" className="hover:text-ink">
        {activeUniverse?.name ?? 'NEURAL MAP'}
      </Link>
      {segments.length > 0 &&
        segments.map((seg, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight size={11} className="shrink-0 opacity-50" />
            <span className={cn('truncate', i === segments.length - 1 && 'text-ink')}>{labelMap[seg] ?? seg}</span>
          </span>
        ))}
    </div>
  );
}

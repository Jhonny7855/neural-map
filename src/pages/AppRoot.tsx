import { useEffect, type ReactNode } from 'react';
import { useApp } from '@/store/app';
import { ConfirmProvider, Toaster } from '@/components/ui';
import { BrainCircuit } from 'lucide-react';

export function AppRoot({ children }: { children: ReactNode }) {
  const ready = useApp((s) => s.ready);
  const init = useApp((s) => s.init);
  const settings = useApp((s) => s.settings);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.classList.toggle('dark', settings.theme !== 'light');
    document.documentElement.setAttribute('data-motion', settings.motion);
    const size = settings.fontSize === 'sm' ? '15px' : settings.fontSize === 'lg' ? '17px' : '16px';
    document.documentElement.style.fontSize = size;
  }, [settings.theme, settings.motion, settings.fontSize]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--line)]" style={{ background: 'linear-gradient(135deg, rgba(54,214,255,0.18), rgba(145,102,255,0.16))' }}>
          <BrainCircuit size={22} className="text-[var(--accent)] animate-pulseSoft" />
        </div>
        <div className="text-center">
          <p className="font-display text-sm font-semibold tracking-tight">Loading knowledge graph</p>
          <p className="mt-1 text-xs text-muted">Restoring your local session</p>
        </div>
      </div>
    );
  }

  return (
    <ConfirmProvider>
      {children}
      <Toaster />
      <AchievementOverlay />
    </ConfirmProvider>
  );
}

function AchievementOverlay() {
  const unlocked = useApp((s) => s.unlockedAchievement);
  const dismiss = useApp((s) => s.dismissAchievement);

  useEffect(() => {
    if (!unlocked) return;
    const t = setTimeout(dismiss, 5200);
    return () => clearTimeout(t);
  }, [unlocked, dismiss]);

  if (!unlocked) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[130] flex justify-center px-4">
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-panel"
        style={{
          background: 'var(--panel)',
          borderColor: 'color-mix(in srgb, var(--mastery) 45%, var(--line))',
          boxShadow: '0 0 40px -10px color-mix(in srgb, var(--mastery) 60%, transparent)',
        }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--mastery) 18%, transparent)' }}>
          <span className="font-display text-sm font-bold" style={{ color: 'var(--mastery)' }}>★</span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--mastery)' }}>
            Achievement unlocked
          </p>
          <p className="text-xs font-semibold">{unlocked.title}</p>
          <p className="text-[11px] text-muted">{unlocked.description}</p>
        </div>
        <button onClick={dismiss} className="ml-2 text-muted hover:text-ink" aria-label="Dismiss achievement">
          ×
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  BrainCircuit,
  Download,
  Eye,
  Gauge,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  Upload,
  User,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, Modal, Panel, ProgressBar, SectionTitle, Tabs, useConfirm } from '@/components/ui';
import type { Settings, ThemeName } from '@/types';
import { cn, downloadFile, formatMinutes } from '@/lib/utils';

const THEMES: { id: ThemeName; label: string; hint: string; swatch: string[] }[] = [
  { id: 'neural-dark', label: 'Neural Dark', hint: 'Default. Cyan on deep navy.', swatch: ['#070B14', '#0E1524', '#36D6FF'] },
  { id: 'deep-space', label: 'Deep Space', hint: 'Violet accents, softer contrast.', swatch: ['#0A0714', '#150F26', '#9166FF'] },
  { id: 'midnight', label: 'Midnight', hint: 'Muted teal, low glare for night.', swatch: ['#061014', '#0C1C21', '#2FD8B0'] },
  { id: 'light', label: 'Daylight', hint: 'Bright surfaces for daytime study.', swatch: ['#F5F7FA', '#FFFFFF', '#0B8FB0'] },
];

type TabId = 'appearance' | 'learning' | 'ai' | 'profile' | 'data';

export function SettingsPage() {
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const resetAll = useApp((s) => s.resetAll);
  const exportSnapshot = useApp((s) => s.exportSnapshot);
  const toast = useApp((s) => s.toast);
  const importUniverse = useApp((s) => s.importUniverse);
  const confirm = useConfirm();

  const [tab, setTab] = useState<TabId>('appearance');
  const [resetOpen, setResetOpen] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [name, setName] = useState(settings.profile.name);
  const [tagline, setTagline] = useState(settings.profile.tagline);

  const set = (patch: Partial<Settings>) => updateSettings(patch);
  const setAi = (patch: Partial<Settings['ai']>) => updateSettings({ ai: { ...settings.ai, ...patch } });

  const doExport = () => {
    const snapshot = exportSnapshot();
    downloadFile(`neural-map-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), 'application/json');
    toast({ title: 'Snapshot exported', description: 'Your full graph was saved as JSON.', tone: 'success' });
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          universe?: { name?: string };
          universes?: { name?: string }[];
          nodes?: unknown[];
          edges?: unknown[];
        };
        if (!parsed.universes && !parsed.nodes) throw new Error('No graph data found in this file.');
        if (parsed.universes && parsed.universes.length > 0 && Array.isArray(parsed.nodes)) {
          const universe = parsed.universes[0];
          const nodes = parsed.nodes as never[];
          const edges = (parsed.edges ?? []) as never[];
          importUniverse({
            universe: {
              id: 'imported',
              name: universe.name ?? 'Imported universe',
              description: 'Imported from snapshot',
              icon: 'box',
              color: '#36D6FF',
              rootNodeId: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              sourceCount: 0,
              tags: ['imported'],
            },
            nodes,
            edges,
          });
          toast({ title: 'Universe imported', description: universe.name ?? 'Snapshot loaded', tone: 'success' });
        } else {
          toast({ title: 'Nothing to import', description: 'The file has no universes to restore.', tone: 'warn' });
        }
      } catch (err) {
        toast({
          title: 'Import failed',
          description: err instanceof Error ? err.message : 'The file could not be parsed.',
          tone: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    setResetOpen(false);
    const ok = await confirm({
      title: 'Reset everything?',
      description: 'All universes, progress, attempts and settings will be replaced by the demo universe. This cannot be undone.',
      confirmLabel: 'Reset all data',
      danger: true,
    });
    if (!ok) return;
    await resetAll();
    toast({ title: 'Workspace reset', description: 'The demo universe has been restored.', tone: 'success' });
  };

  return (
    <div className="mx-auto max-w-[1000px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">System</p>
        <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">Settings</h1>
        <p className="mt-1 text-xs text-muted">Everything is stored locally in your browser. Nothing leaves this device.</p>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'appearance', label: 'Appearance', icon: <Palette size={12} /> },
          { id: 'learning', label: 'Learning', icon: <Gauge size={12} /> },
          { id: 'ai', label: 'AI provider', icon: <Sparkles size={12} /> },
          { id: 'profile', label: 'Profile', icon: <User size={12} /> },
          { id: 'data', label: 'Data', icon: <Download size={12} /> },
        ]}
      />

      <div className="mt-4 space-y-4">
        {tab === 'appearance' && (
          <>
            <Panel className="p-4">
              <SectionTitle title="Theme" hint="pick the palette that fits your study environment" />
              <div className="grid gap-2 sm:grid-cols-2">
                {THEMES.map((t) => {
                  const active = settings.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => set({ theme: t.id })}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        active ? 'border-[color-mix(in_srgb,var(--accent)_55%,var(--line))]' : 'border-[var(--line)] hover:bg-[var(--panel2)]/60',
                      )}
                      aria-pressed={active}
                    >
                      <span className="flex shrink-0 overflow-hidden rounded-md border border-[var(--line)]">
                        {t.swatch.map((c) => (
                          <span key={c} className="h-8 w-4" style={{ background: c }} />
                        ))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-medium">{t.label}</span>
                          {active && <Badge tone="accent">active</Badge>}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-muted">{t.hint}</span>
                      </span>
                      {t.id === 'light' ? <Sun size={13} className="shrink-0 text-muted" /> : <Moon size={13} className="shrink-0 text-muted" />}
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel className="p-4">
              <SectionTitle title="Interface" hint="graph behaviour and typography" />
              <div className="space-y-3">
                <Row label="Graph layout" hint="How the neural space arranges nodes">
                  <select
                    value={settings.graphLayout}
                    onChange={(e) => set({ graphLayout: e.target.value as Settings['graphLayout'] })}
                    className="input h-8 w-40 !py-0 text-[11px]"
                  >
                    <option value="hierarchy">Hierarchy</option>
                    <option value="radial">Radial</option>
                    <option value="organic">Organic</option>
                  </select>
                </Row>
                <Row label="Text size" hint="Base font size for the whole app">
                  <div className="flex gap-1">
                    {(['sm', 'base', 'lg'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => set({ fontSize: size })}
                        className={cn('btn h-7 !px-2.5 text-[10px]', settings.fontSize === size ? 'btn-primary' : 'btn-ghost')}
                      >
                        {size === 'sm' ? 'Small' : size === 'base' ? 'Default' : 'Large'}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row label="Motion" hint="Reduced motion disables large transitions">
                  <div className="flex gap-1">
                    {(['full', 'reduced'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => set({ motion: m })}
                        className={cn('btn h-7 !px-2.5 text-[10px]', settings.motion === m ? 'btn-primary' : 'btn-ghost')}
                      >
                        {m === 'full' ? 'Full' : 'Reduced'}
                      </button>
                    ))}
                  </div>
                </Row>
                <Toggle label="Show mini-map" hint="Overview panel in the neural space" checked={settings.showMiniMap} onChange={(v) => set({ showMiniMap: v })} />
                <Toggle label="Animate edges" hint="Flowing dashed connections" checked={settings.animateEdges} onChange={(v) => set({ animateEdges: v })} />
                <Toggle label="Snap to grid" hint="Align dragged nodes to a 24px grid" checked={settings.snapToGrid} onChange={(v) => set({ snapToGrid: v })} />
              </div>
            </Panel>
          </>
        )}

        {tab === 'learning' && (
          <>
            <Panel className="p-4">
              <SectionTitle title="Daily goal" hint="used for the streak and dashboard ring" />
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={180}
                  step={5}
                  value={settings.dailyGoalMinutes}
                  onChange={(e) => set({ dailyGoalMinutes: Number(e.target.value) })}
                  className="flex-1 accent-[var(--accent)]"
                  aria-label="Daily goal minutes"
                />
                <span className="w-20 shrink-0 text-right font-mono text-xs">{formatMinutes(settings.dailyGoalMinutes)}</span>
              </div>
              <ProgressBar value={Math.min(100, (settings.dailyGoalMinutes / 120) * 100)} className="mt-3" />
            </Panel>

            <Panel className="p-4">
              <SectionTitle title="Revision scheduler" hint="how intervals are computed after each recall" />
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: 'sm2' as const, title: 'SM-2 adaptive', body: 'Ease factor grows with strong recall. Best long-term retention.' },
                  { id: 'simple' as const, title: 'Simple ladder', body: 'Fixed 1 → 3 → 7 → 14 day intervals. Predictable and easy.' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => set({ revisionAlgorithm: opt.id })}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-colors',
                      settings.revisionAlgorithm === opt.id
                        ? 'border-[color-mix(in_srgb,var(--accent)_55%,var(--line))]'
                        : 'border-[var(--line)] hover:bg-[var(--panel2)]/60',
                    )}
                    aria-pressed={settings.revisionAlgorithm === opt.id}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{opt.title}</span>
                      {settings.revisionAlgorithm === opt.id && <Badge tone="accent">active</Badge>}
                    </span>
                    <span className="mt-1 block text-[10px] leading-relaxed text-muted">{opt.body}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <SectionTitle title="Notifications" hint="in-app toasts only" />
              <div className="space-y-3">
                <Toggle
                  label="Quest completions"
                  hint="Notify when a quest target is reached"
                  checked={settings.notifications.quests}
                  onChange={(v) => set({ notifications: { ...settings.notifications, quests: v } })}
                />
                <Toggle
                  label="Revision reminders"
                  hint="Remind when concepts become due"
                  checked={settings.notifications.revision}
                  onChange={(v) => set({ notifications: { ...settings.notifications, revision: v } })}
                />
                <Toggle
                  label="Achievements"
                  hint="Celebrate unlocked achievements"
                  checked={settings.notifications.achievements}
                  onChange={(v) => set({ notifications: { ...settings.notifications, achievements: v } })}
                />
              </div>
            </Panel>
          </>
        )}

        {tab === 'ai' && (
          <Panel className="p-4">
            <SectionTitle
              title="AI provider"
              hint="the assistant works fully offline in demo mode"
              right={<Badge tone={settings.ai.enabled ? 'ai' : 'neutral'}>{settings.ai.enabled ? 'connected' : 'demo mode'}</Badge>}
            />
            <div className="space-y-3">
              <Row label="Provider" hint="Demo synthesizes answers from your own graph">
                <select
                  value={settings.ai.provider}
                  onChange={(e) => setAi({ provider: e.target.value as Settings['ai']['provider'] })}
                  className="input h-8 w-44 !py-0 text-[11px]"
                >
                  <option value="demo">Demo (local)</option>
                  <option value="openai-compatible">OpenAI compatible</option>
                  <option value="ollama">Ollama</option>
                  <option value="custom">Custom endpoint</option>
                </select>
              </Row>
              <Row label="Model" hint="e.g. gpt-4o-mini or llama3">
                <input value={settings.ai.model} onChange={(e) => setAi({ model: e.target.value })} className="input h-8 w-44 text-[11px]" />
              </Row>
              <Row label="Base URL" hint="Required for non-demo providers">
                <input
                  value={settings.ai.baseUrl}
                  onChange={(e) => setAi({ baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="input h-8 w-full max-w-[320px] text-[11px]"
                />
              </Row>
              <Row label="API key" hint="Stored locally, never exported">
                <input
                  type="password"
                  value={settings.ai.apiKey}
                  onChange={(e) => setAi({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="input h-8 w-full max-w-[320px] text-[11px]"
                />
              </Row>
              <Row label="Temperature" hint="Lower is more literal">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.ai.temperature}
                    onChange={(e) => setAi({ temperature: Number(e.target.value) })}
                    className="w-32 accent-[var(--ai)]"
                  />
                  <span className="font-mono text-[11px]">{settings.ai.temperature.toFixed(2)}</span>
                </div>
              </Row>
              <Toggle
                label="Enable remote calls"
                hint="Off keeps every answer generated on-device"
                checked={settings.ai.enabled}
                onChange={(v) => setAi({ enabled: v })}
              />
              <p className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/50 p-2.5 text-[10px] leading-relaxed text-muted">
                With remote calls disabled the assistant answers using retrieval over your nodes, formulas and definitions. That is
                intentional: it keeps the app usable with no network, no key and no cost.
              </p>
            </div>
          </Panel>
        )}

        {tab === 'profile' && (
          <Panel className="p-4">
            <SectionTitle title="Profile" hint="shown on the dashboard and in the sidebar" />
            <div className="space-y-3">
              <div>
                <label className="label" htmlFor="profile-name">
                  Display name
                </label>
                <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" maxLength={40} />
              </div>
              <div>
                <label className="label" htmlFor="profile-tagline">
                  Tagline
                </label>
                <input
                  id="profile-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="input mt-1"
                  maxLength={80}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    set({ profile: { name: name.trim() || 'Explorer', tagline: tagline.trim() } });
                    toast({ title: 'Profile saved', tone: 'success' });
                  }}
                  className="btn btn-primary"
                >
                  Save profile
                </button>
                <button
                  onClick={() => {
                    setName(settings.profile.name);
                    setTagline(settings.profile.tagline);
                  }}
                  className="btn btn-ghost"
                >
                  Revert
                </button>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg font-display text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, rgba(54,214,255,0.28), rgba(145,102,255,0.28))' }}
                >
                  {(name || 'E').slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{name || 'Explorer'}</p>
                  <p className="truncate text-[11px] text-muted">{tagline || 'Mapping the unknown'}</p>
                </div>
                <div className="flex-1" />
                <Eye size={13} className="text-muted" />
              </div>
            </div>
          </Panel>
        )}

        {tab === 'data' && (
          <>
            <Panel className="p-4">
              <SectionTitle title="Backup and restore" hint="JSON snapshots include universes, progress and settings" />
              <div className="flex flex-wrap gap-2">
                <button onClick={doExport} className="btn btn-primary">
                  <Download size={13} /> Export snapshot
                </button>
                <label className="btn btn-ghost cursor-pointer">
                  <Upload size={13} /> Import snapshot
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) doImport(file);
                      e.target.value = '';
                    }}
                  />
                </label>
                <button onClick={() => setRawOpen(true)} className="btn btn-ghost">
                  <BrainCircuit size={13} /> View raw state
                </button>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-muted">
                API keys are stripped from exports. Importing a snapshot adds the first universe in the file as a new universe and leaves
                your existing data intact.
              </p>
            </Panel>

            <Panel className="p-4">
              <SectionTitle title="Danger zone" hint="irreversible" />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3" style={{ borderColor: 'rgba(255,107,129,0.35)', background: 'rgba(255,107,129,0.06)' }}>
                <div className="min-w-0">
                  <p className="text-xs font-medium">Reset workspace</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    Deletes every universe you created and restores the demo graph. Export first if you want a copy.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="btn"
                  style={{ background: 'rgba(255,107,129,0.16)', border: '1px solid rgba(255,107,129,0.5)', color: '#FF8A9B' }}
                >
                  <RotateCcw size={13} /> Reset all data
                </button>
              </div>
            </Panel>

            <Modal
              open={resetOpen}
              onClose={() => setResetOpen(false)}
              title="Reset workspace"
              description="This restores the demo universe."
              footer={
                <button className="btn btn-ghost" onClick={() => setResetOpen(false)}>
                  Close
                </button>
              }
            >
              <p className="text-xs text-muted">Use the Reset all data button in the danger zone to confirm.</p>
            </Modal>

            <Modal open={rawOpen} onClose={() => setRawOpen(false)} title="Raw state" description="Read-only JSON of the exported snapshot." width="max-w-2xl">
              <button
                className="btn btn-ghost mb-2 h-7 text-[11px]"
                onClick={() => setRawJson(JSON.stringify(exportSnapshot(), null, 2))}
              >
                Load current state
              </button>
              <pre className="max-h-[45vh] overflow-auto rounded-lg border border-[var(--line)] bg-[var(--panel2)] p-3 text-[10px] leading-relaxed">
                {rawJson || 'Click "Load current state" to render the snapshot.'}
              </pre>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-[10px] text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-[10px] text-muted">{hint}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn('relative h-5 w-9 shrink-0 rounded-full border transition-colors', checked ? 'border-transparent' : 'border-[var(--line)]')}
        style={{ background: checked ? 'var(--accent)' : 'var(--panel2)' }}
      >
        <span
          className="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all"
          style={{ left: checked ? 18 : 3 }}
        />
      </button>
    </div>
  );
}

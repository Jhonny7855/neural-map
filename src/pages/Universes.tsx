import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Boxes,
  Compass,
  Copy,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, Modal, ProgressBar, SectionTitle, useConfirm } from '@/components/ui';
import { computeMastery } from '@/lib/learning';
import { percent, timeAgo } from '@/lib/utils';

const ICONS = ['brain-circuit', 'atom', 'flask', 'globe', 'sigma', 'dna', 'orbit', 'network'];
const COLORS = ['#36D6FF', '#9166FF', '#5BE7A9', '#FFB86B', '#FF6B81', '#4FD1C5', '#B47BFF', '#FFD66B'];

export function Universes() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const universes = useApp((s) => s.universes);
  const nodes = useApp((s) => s.nodes);
  const progress = useApp((s) => s.progress);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const setActiveUniverse = useApp((s) => s.setActiveUniverse);
  const createUniverse = useApp((s) => s.createUniverse);
  const updateUniverse = useApp((s) => s.updateUniverse);
  const deleteUniverse = useApp((s) => s.deleteUniverse);
  const duplicateUniverse = useApp((s) => s.duplicateUniverse);
  const toast = useApp((s) => s.toast);

  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: ICONS[0], color: COLORS[0], tags: '' });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return universes;
    return universes.filter(
      (u) => u.name.toLowerCase().includes(q) || u.description.toLowerCase().includes(q) || u.tags.some((t) => t.includes(q)),
    );
  }, [universes, query]);

  const statsFor = (id: string) => {
    const list = nodes.filter((n) => n.universeId === id);
    const explored = list.filter((n) => progress[n.id]?.firstStudied).length;
    const mastered = list.filter((n) => progress[n.id]?.status === 'mastered').length;
    const mastery = list.length
      ? Math.round(list.reduce((acc, n) => acc + (progress[n.id] ? computeMastery(progress[n.id]) : 0), 0) / list.length)
      : 0;
    return { total: list.length, explored, mastered, mastery };
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '', icon: ICONS[0], color: COLORS[0], tags: '' });
    setCreateOpen(true);
  };

  const openEdit = (id: string) => {
    const u = universes.find((x) => x.id === id);
    if (!u) return;
    setEditingId(id);
    setForm({ name: u.name, description: u.description, icon: u.icon, color: u.color, tags: u.tags.join(', ') });
    setCreateOpen(true);
  };

  const submit = () => {
    const name = form.name.trim();
    if (!name) {
      toast({ title: 'Name required', description: 'Give the universe a name before saving.', tone: 'warn' });
      return;
    }
    const tags = form.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 6);
    if (editingId) {
      updateUniverse(editingId, { name, description: form.description.trim(), icon: form.icon, color: form.color, tags });
      toast({ title: 'Universe updated', tone: 'success' });
    } else {
      const id = createUniverse({ name, description: form.description.trim(), icon: form.icon, color: form.color, tags });
      setActiveUniverse(id);
      toast({ title: 'Universe created', description: 'Add your first concept from the Neural Space.', tone: 'success' });
    }
    setCreateOpen(false);
  };

  const remove = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description: 'Every node, connection, source and progress record in this universe will be removed. This cannot be undone.',
      confirmLabel: 'Delete universe',
      danger: true,
    });
    if (!ok) return;
    deleteUniverse(id);
    toast({ title: 'Universe deleted', tone: 'info' });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Knowledge universes</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">Your map collection</h1>
          <p className="mt-1 text-xs text-muted">Each universe is an independent graph with its own progress, sources and paths.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/60 px-2.5">
            <Search size={12} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter universes"
              className="w-32 bg-transparent text-[11px] outline-none placeholder:text-muted sm:w-44"
            />
          </div>
          <button onClick={openCreate} className="btn btn-primary h-8 text-[11px]">
            <Plus size={13} /> New universe
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Compass size={18} />}
          title={query ? 'No universes match that filter' : 'No universes yet'}
          description={
            query
              ? 'Try a different keyword, or clear the filter to see everything.'
              : 'Create a universe to start mapping concepts, then import documents or add nodes by hand.'
          }
          action={
            <button onClick={openCreate} className="btn btn-primary">
              <Plus size={14} /> Create your first universe
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u, i) => {
            const s = statsFor(u.id);
            const active = u.id === activeUniverseId;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
                className="panel relative overflow-hidden p-4"
                style={active ? { borderColor: `color-mix(in srgb, ${u.color} 45%, var(--line))` } : undefined}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-[0.10]"
                  style={{ background: u.color }}
                />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                      style={{ borderColor: `color-mix(in srgb, ${u.color} 40%, var(--line))`, background: `color-mix(in srgb, ${u.color} 14%, transparent)`, color: u.color }}
                    >
                      <Layers size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{u.name}</p>
                      <p className="text-[10px] text-muted">{u.sourceCount} source{u.sourceCount === 1 ? '' : 's'} · {timeAgo(u.updatedAt)}</p>
                    </div>
                  </div>
                  {active && <Badge tone="accent">active</Badge>}
                  {u.demo && !active && <Badge tone="ai">demo</Badge>}
                </div>

                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted">{u.description || 'No description yet.'}</p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Concepts', s.total],
                    ['Explored', s.explored],
                    ['Mastered', s.mastered],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-md border border-[var(--line)] bg-[var(--panel2)]/40 px-1 py-1.5">
                      <p className="font-mono text-[12px]">{String(value)}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted">{String(label)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] text-muted">
                    <span>Average mastery</span>
                    <span className="font-mono">{s.mastery}%</span>
                  </div>
                  <ProgressBar value={s.mastery} height={4} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {u.tags.slice(0, 3).map((t) => (
                    <span key={t} className="chip !px-2 !py-0.5 !text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--line)] pt-3">
                  <button
                    onClick={() => {
                      setActiveUniverse(u.id);
                      navigate('/app/neural-space');
                    }}
                    className="btn btn-primary h-7 flex-1 !px-2 text-[10px]"
                  >
                    Open map <ArrowRight size={11} />
                  </button>
                  <button onClick={() => openEdit(u.id)} className="btn btn-ghost h-7 !px-2 text-[10px]">
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      const id = duplicateUniverse(u.id);
                      if (id) toast({ title: 'Universe duplicated', tone: 'success' });
                    }}
                    className="btn btn-ghost h-7 w-7 !px-0"
                    aria-label="Duplicate universe"
                    title="Duplicate"
                  >
                    <Copy size={11} />
                  </button>
                  <button
                    onClick={() => remove(u.id, u.name)}
                    className="btn btn-ghost h-7 w-7 !px-0"
                    aria-label="Delete universe"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="panel p-4">
          <SectionTitle title="Build a universe from a document" hint="PDF, DOCX, Markdown or plain text" />
          <p className="text-[11px] leading-relaxed text-muted">
            The Import Center extracts structure from your document, proposes concepts and connections, and lets you review
            everything before it enters the graph.
          </p>
          <Link to="/app/import" className="btn btn-ghost mt-3 h-8 text-[11px]">
            <Upload size={12} /> Open Import Center
          </Link>
        </div>
        <div className="panel p-4">
          <SectionTitle title="Or start from the demo" hint="62 concepts, fully authored" />
          <p className="text-[11px] leading-relaxed text-muted">
            The Machine Learning Galaxy ships with theory, worked examples, formulas, applications and graded questions — no
            API key required.
          </p>
          <button
            onClick={() => {
              const demo = universes.find((u) => u.demo);
              if (demo) {
                setActiveUniverse(demo.id);
                navigate('/app/neural-space');
              } else {
                navigate('/app/import');
              }
            }}
            className="btn btn-ghost mt-3 h-8 text-[11px]"
          >
            <Sparkles size={12} /> Open the demo universe
          </button>
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={editingId ? 'Edit universe' : 'New universe'}
        description={editingId ? 'Update the metadata for this universe.' : 'Name it after the subject you want to map.'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submit}>
              {editingId ? 'Save changes' : 'Create universe'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label mb-1 block" htmlFor="u-name">
              Name
            </label>
            <input
              id="u-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Organic Chemistry"
              className="input"
              maxLength={80}
            />
          </div>
          <div>
            <label className="label mb-1 block" htmlFor="u-desc">
              Description
            </label>
            <textarea
              id="u-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={600}
              placeholder="What does this universe cover?"
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label mb-1 block" htmlFor="u-tags">
              Tags
            </label>
            <input
              id="u-tags"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="comma separated, e.g. chemistry, exams"
              className="input"
            />
          </div>
          <div>
            <p className="label mb-1.5">Accent colour</p>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: form.color === c ? 'var(--ink)' : 'transparent' }}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="label mb-1.5">Icon</p>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                  className="chip capitalize"
                  style={form.icon === ic ? { borderColor: form.color, color: form.color } : undefined}
                >
                  <Boxes size={10} /> {ic.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

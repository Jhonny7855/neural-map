import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Layers,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, EmptyState, ProgressBar, SectionTitle, useConfirm } from '@/components/ui';
import { cn, percent, timeAgo, uid } from '@/lib/utils';
import type { Difficulty, KnowledgeEdge, KnowledgeNode, NodeType, SourceDocument, Universe } from '@/types';

type Stage = 'idle' | 'reading' | 'extracting' | 'review' | 'done';

interface Draft {
  title: string;
  summary: string;
  type: NodeType;
  difficulty: Difficulty;
  level: number;
  include: boolean;
}

interface Extracted {
  name: string;
  kind: string;
  size: number;
  pageCount?: number;
  text: string;
}

const MAX_BYTES = 25 * 1024 * 1024;

async function readPdf(file: File): Promise<Extracted> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  const limit = Math.min(doc.numPages, 120);
  for (let i = 1; i <= limit; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  return { name: file.name, kind: 'pdf', size: file.size, pageCount: doc.numPages, text: pages.join('\n\n') };
}

async function readDocx(file: File): Promise<Extracted> {
  const mammoth = await import('mammoth/mammoth.browser');
  const buffer = await file.arrayBuffer();
  const result = await (mammoth as unknown as {
    extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  }).extractRawText({ arrayBuffer: buffer });
  return { name: file.name, kind: 'docx', size: file.size, text: result.value };
}

async function readPlain(file: File): Promise<Extracted> {
  const text = await file.text();
  return { name: file.name, kind: file.name.split('.').pop()?.toLowerCase() ?? 'txt', size: file.size, text };
}

async function extractFile(file: File): Promise<Extracted> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.pdf')) return readPdf(file);
  if (lower.endsWith('.docx')) return readDocx(file);
  return readPlain(file);
}

const HEADING_RE = /^(?:#{1,4}\s+(.+)|(\d+(?:\.\d+)*)[.)]?\s+([A-Z][^.!?]{2,80})|([A-Z][A-Za-z0-9 ,'&()\-]{3,70}):?)$/;

function buildDrafts(text: string): Draft[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates: { title: string; level: number; body: string[] }[] = [];
  let current: { title: string; level: number; body: string[] } | null = null;

  for (const line of lines) {
    const heading = line.match(HEADING_RE);
    const isShort = line.length <= 90 && !/[.!?]$/.test(line);
    if (heading && isShort) {
      const title = (heading[1] ?? (heading[2] ? `${heading[2]} ${heading[3]}` : heading[4] ?? line)).replace(/^#+\s*/, '').trim();
      if (title.length >= 3) {
        const level = line.startsWith('#') ? (line.match(/^#+/)?.[0].length ?? 1) : heading[2] ? heading[2].split('.').length : 1;
        current = { title: title.slice(0, 80), level: Math.min(4, level), body: [] };
        candidates.push(current);
        continue;
      }
    }
    if (current) current.body.push(line);
  }

  if (candidates.length < 3) {
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 120);
    return paragraphs.slice(0, 24).map((p, i) => {
      const sentence = p.split(/(?<=[.!?])\s/)[0] ?? p.slice(0, 70);
      return {
        title: sentence.replace(/^[^A-Za-z]*/, '').slice(0, 72) || `Section ${i + 1}`,
        summary: p.slice(0, 220),
        type: 'concept' as NodeType,
        difficulty: 'intermediate' as Difficulty,
        level: 1,
        include: i < 12,
      };
    });
  }

  const maxLevel = Math.max(...candidates.map((c) => c.level));
  return candidates.slice(0, 40).map((c) => {
    const body = c.body.join(' ').slice(0, 240);
    const type: NodeType = c.level === 1 && maxLevel > 1 ? 'topic' : c.level >= 3 ? 'concept' : 'concept';
    return {
      title: c.title,
      summary: body || `Extracted section from the imported document.`,
      type,
      difficulty: c.level >= 3 ? ('advanced' as Difficulty) : ('intermediate' as Difficulty),
      level: c.level,
      include: true,
    };
  });
}

export function ImportCenter() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);

  const universes = useApp((s) => s.universes);
  const sources = useApp((s) => s.sources);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const addSource = useApp((s) => s.addSource);
  const removeSource = useApp((s) => s.removeSource);
  const importUniverse = useApp((s) => s.importUniverse);
  const setActiveUniverse = useApp((s) => s.setActiveUniverse);
  const toast = useApp((s) => s.toast);

  const [stage, setStage] = useState<Stage>('idle');
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [targetUniverse, setTargetUniverse] = useState<string>(activeUniverseId ?? universes[0]?.id ?? '');
  const [newUniverseName, setNewUniverseName] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  const docSources = useMemo(() => sources.slice(0, 12), [sources]);
  const included = drafts.filter((d) => d.include);

  const reset = () => {
    setStage('idle');
    setExtracted(null);
    setDrafts([]);
    setError(null);
    setProgressPct(0);
  };

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(`"${file.name}" is larger than 25 MB. Split the document or paste the text instead.`);
      return;
    }
    setStage('reading');
    setProgressPct(15);
    try {
      const result = await extractFile(file);
      setProgressPct(55);
      if (!result.text || result.text.trim().length < 80) {
        throw new Error('The document produced almost no readable text. It may be a scanned image.');
      }
      setStage('extracting');
      setProgressPct(75);
      const found = buildDrafts(result.text);
      setExtracted(result);
      setDrafts(found);
      setProgressPct(100);
      setStage('review');
      if (found.length === 0) setError('No headings or paragraphs were detected. Try a document with clearer structure.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not read that file.';
      setError(message);
      setStage('idle');
      setProgressPct(0);
    }
  };

  const commit = () => {
    if (!extracted || included.length === 0) return;

    const existing = targetUniverse ? universes.find((u) => u.id === targetUniverse) : undefined;
    if (!existing && !newUniverseName.trim()) {
      toast({ title: 'Name the universe', description: 'Pick an existing universe or type a name for a new one.', tone: 'warn' });
      return;
    }

    const now = new Date().toISOString();
    const rootId = uid('n');
    const rootTitle = extracted.name.replace(/\.[^.]+$/, '');
    const universeId = existing?.id ?? uid('u');
    const anchorParentId = existing?.rootNodeId ?? null;

    const rootNode: KnowledgeNode = {
      id: rootId,
      universeId,
      parentId: anchorParentId,
      title: rootTitle.slice(0, 80),
      slug: rootTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
      summary: `Root of the universe imported from ${extracted.name}.`,
      description: `Imported from ${extracted.name} (${extracted.kind.toUpperCase()}).`,
      type: 'universe',
      difficulty: 'beginner',
      objectives: ['Navigate the extracted structure'],
      estimatedMinutes: 5,
      theory: [
        {
          heading: 'About this import',
          body: `This universe was generated from **${extracted.name}**. ${included.length} sections were extracted and can be edited or extended from the Neural Space.`,
        },
      ],
      definitions: [],
      keyPrinciples: [],
      visuals: [],
      examples: [],
      formulas: [],
      applications: [],
      questions: [],
      prerequisites: [],
      related: [],
      extensions: [],
      contrasts: [],
      crossSubject: [],
      sourceRefs: [{ documentName: extracted.name }],
      position: { x: 0, y: 0 },
      masteryScore: 0,
      created: now,
      updated: now,
    };

    const nodes: KnowledgeNode[] = [rootNode];
    const edges: KnowledgeEdge[] = [];

    if (anchorParentId) {
      edges.push({
        id: uid('e'),
        universeId,
        source: anchorParentId,
        target: rootId,
        type: 'contains',
        explanation: `${rootTitle} was imported into this universe.`,
        confidence: 1,
        discoveredAt: now,
      });
    }

    const levelStack: { id: string; level: number }[] = [{ id: rootId, level: 0 }];

    included.forEach((d, index) => {
      const id = uid('n');
      while (levelStack.length > 1 && levelStack[levelStack.length - 1].level >= d.level) levelStack.pop();
      const parentId = levelStack[levelStack.length - 1].id;
      nodes.push({
        id,
        universeId,
        parentId,
        title: d.title,
        slug: d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
        summary: d.summary,
        description: d.summary,
        type: d.type,
        difficulty: d.difficulty,
        objectives: [],
        estimatedMinutes: 10,
        theory: [{ heading: 'Imported content', body: d.summary }],
        definitions: [],
        keyPrinciples: [],
        visuals: [],
        examples: [],
        formulas: [],
        applications: [],
        questions: [],
        prerequisites: [],
        related: [],
        extensions: [],
        contrasts: [],
        crossSubject: [],
        sourceRefs: [{ documentName: extracted.name }],
        position: { x: 340, y: index * 130 },
        masteryScore: 0,
        created: now,
        updated: now,
      });
      edges.push({
        id: uid('e'),
        universeId,
        source: parentId,
        target: id,
        type: 'contains',
        explanation: `${d.title} is part of the imported structure.`,
        confidence: 1,
        discoveredAt: now,
      });
      levelStack.push({ id, level: d.level });
    });

    if (existing) {
      useApp.getState().appendGraph({ universeId, nodes, edges });
    } else {
      importUniverse({
        universe: {
          id: universeId,
          name: newUniverseName.trim() || rootTitle,
          description: `Imported from ${extracted.name}.`,
          icon: 'layers',
          color: '#36D6FF',
          rootNodeId: rootId,
          createdAt: now,
          updatedAt: now,
          sourceCount: 0,
          tags: ['imported'],
        },
        nodes,
        edges,
      });
    }

    const doc: SourceDocument = {
      id: uid('doc'),
      universeId,
      name: extracted.name,
      kind: extracted.kind,
      size: extracted.size,
      pageCount: extracted.pageCount,
      extractedChars: extracted.text.length,
      createdAt: now,
      status: 'ready',
      textPreview: extracted.text.slice(0, 400),
      text: extracted.text.slice(0, 400_000),
      mapping: `${nodes.length} nodes · ${edges.length} edges`,
    };
    addSource(doc);

    setActiveUniverse(universeId);
    setStage('done');
    toast({
      title: 'Import complete',
      description: `${nodes.length} concepts added to the graph.`,
      tone: 'success',
    });
  };

  const removeDoc = async (id: string, name: string) => {
    const ok = await confirm({ title: `Remove "${name}"?`, description: 'The source record is deleted. Nodes already created stay in the graph.', danger: true, confirmLabel: 'Remove' });
    if (ok) removeSource(id);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Import center</p>
        <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">Turn documents into graphs</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          Drop a PDF, DOCX, Markdown or text file. The extractor reads headings and paragraphs, proposes concepts, and lets
          you approve every node before anything touches your graph.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="border-b border-[var(--line)] px-4 py-3">
              <h3 className="text-sm font-semibold">Source document</h3>
              <p className="mt-0.5 text-[11px] text-muted">PDF · DOCX · MD · TXT · up to 25 MB</p>
            </div>

            <div className="p-4">
              {stage === 'idle' && (
                <>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.dataset.hot = 'true';
                    }}
                    onDragLeave={(e) => {
                      delete e.currentTarget.dataset.hot;
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      delete e.currentTarget.dataset.hot;
                      void handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => inputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] data-[hot=true]:border-[var(--accent)] data-[hot=true]:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                  >
                    <div
                      className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)]"
                      style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
                    >
                      <Upload size={18} className="text-[var(--accent)]" />
                    </div>
                    <p className="text-sm font-medium">Drop a document or click to browse</p>
                    <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted">
                      Text is parsed locally in your browser. Nothing is uploaded to a server.
                    </p>
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.docx,.md,.markdown,.txt,.csv"
                      className="hidden"
                      onChange={(e) => void handleFiles(e.target.files)}
                    />
                  </div>
                  {error && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border px-2.5 py-2" style={{ borderColor: 'rgba(255,107,129,0.45)', background: 'rgba(255,107,129,0.08)' }}>
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: '#FF6B81' }} />
                      <p className="text-[11px] leading-relaxed" style={{ color: '#FF9AA8' }}>
                        {error}
                      </p>
                    </div>
                  )}
                </>
              )}

              {(stage === 'reading' || stage === 'extracting') && (
                <div className="py-10 text-center">
                  <Loader2 size={22} className="mx-auto animate-spin text-[var(--accent)]" />
                  <p className="mt-3 text-xs font-medium">
                    {stage === 'reading' ? 'Reading document…' : 'Extracting structure…'}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">{extracted?.name ?? 'Preparing'}</p>
                  <ProgressBar value={progressPct} className="mx-auto mt-4 max-w-xs" />
                </div>
              )}

              {stage === 'review' && extracted && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText size={13} className="shrink-0 text-[var(--accent)]" />
                      <span className="truncate text-[11px] font-medium">{extracted.name}</span>
                      <Badge tone="neutral">{extracted.kind}</Badge>
                      {extracted.pageCount && <Badge tone="neutral">{extracted.pageCount}p</Badge>}
                    </div>
                    <button onClick={reset} className="btn btn-ghost h-6 !px-2 text-[10px]">
                      <X size={10} /> Start over
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>
                      {included.length} of {drafts.length} sections selected
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setDrafts((d) => d.map((x) => ({ ...x, include: true })))} className="btn btn-ghost h-6 !px-2 text-[10px]">
                        All
                      </button>
                      <button onClick={() => setDrafts((d) => d.map((x) => ({ ...x, include: false })))} className="btn btn-ghost h-6 !px-2 text-[10px]">
                        None
                      </button>
                    </div>
                  </div>

                  <ul className="max-h-[46vh] space-y-1 overflow-y-auto pr-1">
                    {drafts.map((d, i) => (
                      <li key={i}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-start gap-2 rounded-lg border px-2.5 py-2 transition-colors',
                            d.include
                              ? 'border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]'
                              : 'border-[var(--line)]',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={d.include}
                            onChange={(e) => setDrafts((list) => list.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))}
                            className="mt-0.5 accent-[var(--accent)]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[11.5px] font-medium" style={{ paddingLeft: (d.level - 1) * 10 }}>
                                {d.title}
                              </span>
                              <Badge tone="neutral">L{d.level}</Badge>
                            </span>
                            <span className="mt-0.5 block line-clamp-2 text-[10px] leading-snug text-muted">{d.summary}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2 border-t border-[var(--line)] pt-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="label mb-1 block" htmlFor="target-universe">
                          Target universe
                        </label>
                        <select
                          id="target-universe"
                          value={targetUniverse}
                          onChange={(e) => setTargetUniverse(e.target.value)}
                          className="input text-[11px]"
                        >
                          <option value="">— create new —</option>
                          {universes.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {!targetUniverse && (
                        <div>
                          <label className="label mb-1 block" htmlFor="new-universe">
                            New universe name
                          </label>
                          <input
                            id="new-universe"
                            value={newUniverseName}
                            onChange={(e) => setNewUniverseName(e.target.value)}
                            placeholder={extracted.name.replace(/\.[^.]+$/, '')}
                            className="input text-[11px]"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      disabled={included.length === 0}
                      onClick={commit}
                      className="btn btn-primary h-8 w-full text-[11px]"
                    >
                      <Sparkles size={12} /> Add {included.length} concepts to the graph
                    </button>
                  </div>
                </div>
              )}

              {stage === 'done' && (
                <div className="py-8 text-center">
                  <div
                    className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: 'color-mix(in srgb, var(--mastery) 16%, transparent)' }}
                  >
                    <CheckCircle2 size={20} style={{ color: 'var(--mastery)' }} />
                  </div>
                  <p className="text-sm font-semibold">Import complete</p>
                  <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-muted">
                    The new concepts are in your graph with their source references attached.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button onClick={() => navigate('/app/neural-space')} className="btn btn-primary h-8 text-[11px]">
                      <Layers size={12} /> Open the graph
                    </button>
                    <button onClick={reset} className="btn btn-ghost h-8 text-[11px]">
                      Import another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="panel p-4">
            <SectionTitle title="How extraction works" hint="transparent, local, reviewable" />
            <ol className="space-y-2">
              {[
                ['Parse', 'PDF text layers and DOCX runs are extracted in-browser. Scanned images without a text layer are rejected rather than guessed at.'],
                ['Detect structure', 'Markdown headings, numbered sections and short standalone lines become candidates. Depth determines hierarchy.'],
                ['Propose concepts', 'Each candidate becomes a node with a summary taken from its first paragraph. Nothing is invented.'],
                ['Review and commit', 'You choose which candidates become nodes, and where they land. Source references are attached automatically.'],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-2.5">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[10px]"
                    style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <SectionTitle title="Imported sources" hint={`${sources.length} stored`} />
            {docSources.length === 0 ? (
              <EmptyState icon={<FileText size={16} />} title="No sources yet" description="Every import is recorded here with its extraction stats." />
            ) : (
              <ul className="space-y-1.5">
                {docSources.map((d) => (
                  <motion.li
                    key={d.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/30 px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium">{d.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {d.kind.toUpperCase()} · {Math.round(d.size / 1024)} KB · {d.extractedChars.toLocaleString()} chars
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {d.mapping} · {timeAgo(d.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge tone={d.status === 'ready' ? 'mastery' : d.status === 'error' ? 'danger' : 'warn'}>
                          {d.status === 'ready' ? <Check size={9} /> : null}
                          {d.status}
                        </Badge>
                        <button onClick={() => void removeDoc(d.id, d.name)} className="text-muted hover:text-ink" aria-label={`Remove ${d.name}`}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted/80">{d.textPreview}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-4">
            <SectionTitle title="Source coverage" hint="per universe" />
            <ul className="space-y-2">
              {universes.map((u) => {
                const count = sources.filter((s) => s.universeId === u.id).length;
                return (
                  <li key={u.id}>
                    <div className="mb-1 flex items-center justify-between text-[10.5px]">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: u.color }} />
                        <span className="truncate">{u.name}</span>
                      </span>
                      <span className="shrink-0 font-mono text-muted">{count}</span>
                    </div>
                    <ProgressBar value={percent(count, Math.max(1, sources.length))} height={3} />
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="panel p-4">
            <SectionTitle title="Export a graph" hint="JSON, re-importable" />
            <p className="text-[11px] leading-relaxed text-muted">
              Export a universe as a validated graph file. Useful for backups, sharing, or moving a map between browsers.
            </p>
            <button
              onClick={() => {
                const snapshot = useApp.getState().exportSnapshot() as {
                  universes: Universe[];
                  nodes: KnowledgeNode[];
                  edges: KnowledgeEdge[];
                };
                const universe = snapshot.universes.find((u) => u.id === targetUniverse) ?? snapshot.universes[0];
                if (!universe) {
                  toast({ title: 'Nothing to export', tone: 'warn' });
                  return;
                }
                const payload = {
                  version: 1,
                  universe,
                  nodes: snapshot.nodes.filter((n) => n.universeId === universe.id),
                  edges: snapshot.edges.filter((e) => e.universeId === universe.id),
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${universe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.neural.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1500);
                toast({ title: 'Graph exported', description: `${payload.nodes.length} nodes written.`, tone: 'success' });
              }}
              className="btn btn-ghost mt-3 h-8 w-full text-[11px]"
            >
              <Download size={12} /> Export selected universe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

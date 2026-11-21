import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Bot, BrainCircuit, Copy, Plus, Sparkles, Trash2, User } from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, Panel, SectionTitle, useConfirm } from '@/components/ui';
import { cn, renderMarkdown, uid } from '@/lib/utils';
import { computeMastery } from '@/lib/learning';
import type { AIConversation, KnowledgeNode } from '@/types';

interface Reply {
  content: string;
  label: string;
  refs: string[];
}

function nodeLine(n: KnowledgeNode) {
  return `${n.title} — ${n.summary}`;
}

function buildAnswer(prompt: string, nodes: KnowledgeNode[], scope: KnowledgeNode[]): Reply {
  const q = prompt.toLowerCase().trim();
  const pool = scope.length ? scope : nodes;

  if (!q) {
    return { content: 'Ask about any concept in your map and I will pull the answer from your own notes.', label: 'idle', refs: [] };
  }

  const scored = pool
    .map((n) => {
      const haystack = [
        n.title,
        n.summary,
        n.description,
        ...n.keyPrinciples,
        ...n.definitions.map((d) => `${d.term} ${d.meaning}`),
        ...n.formulas.map((f) => `${f.name} ${f.expression}`),
        ...n.theory.map((t) => t.body),
      ]
        .join(' ')
        .toLowerCase();
      const terms = q.split(/\s+/).filter((t) => t.length > 2);
      const hits = terms.filter((t) => haystack.includes(t)).length;
      const titleHit = q.includes(n.title.toLowerCase()) || n.title.toLowerCase().includes(q) ? 3 : 0;
      return { node: n, score: hits + titleHit };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const wants = {
    formula: /\b(formula|equation|math|derive|derive|notation)\b/.test(q),
    example: /\b(example|worked|practice|apply|application)\b/.test(q),
    compare: /\b(difference|compare|versus|vs|contrast)\b/.test(q),
    define: /\b(what is|define|definition|meaning)\b/.test(q),
    summary: /\b(summarize|summary|overview|explain)\b/.test(q),
    related: /\b(related|connection|prerequisite|next)\b/.test(q),
  };

  if (scored.length === 0) {
    const suggestions = pool
      .slice()
      .sort((a, b) => b.importance?.length ?? 0 - (a.importance?.length ?? 0))
      .slice(0, 4);
    return {
      content: `I could not find anything in your map matching **"${prompt}"**.

Your graph currently contains ${pool.length} concepts. Try naming a concept directly, or explore one of these:\n\n${suggestions
        .map((s) => `- **${s.title}** — ${s.summary}`)
        .join('\n')}`,
      label: 'no-match',
      refs: suggestions.map((s) => s.id),
    };
  }

  const primary = scored[0].node;
  const secondary = scored.slice(1, 3).map((s) => s.node);
  const parts: string[] = [];

  if (wants.define || wants.summary) {
    parts.push(`### ${primary.title}\n${primary.description || primary.summary}`);
    if (primary.definitions.length) {
      parts.push(`**Key definitions**\n${primary.definitions.slice(0, 3).map((d) => `- **${d.term}**: ${d.meaning}`).join('\n')}`);
    }
    if (primary.keyPrinciples.length) {
      parts.push(`**Core principles**\n${primary.keyPrinciples.slice(0, 4).map((p) => `- ${p}`).join('\n')}`);
    }
    if (primary.theory.length) {
      const section = primary.theory[0];
      parts.push(`**${section.heading}**\n${section.body.slice(0, 900)}`);
    }
  }

  if (wants.formula) {
    if (primary.formulas.length) {
      parts.push(
        `**Formulas**\n${primary.formulas
          .slice(0, 3)
          .map((f) => `- \`${f.expression}\` — ${f.name}${f.whenToUse ? ` (use when ${f.whenToUse.toLowerCase()})` : ''}`)
          .join('\n')}`,
      );
    } else {
      parts.push('This concept has no formulas recorded yet. Add one from the node editor if you want the math pinned to it.');
    }
  }

  if (wants.example) {
    if (primary.examples.length) {
      const ex = primary.examples[0];
      parts.push(`**Worked example — ${ex.title}**\n${ex.problem}\n\n${ex.solution.slice(0, 700)}`);
    } else if (primary.applications.length) {
      parts.push(`**Where it is used**\n${primary.applications.slice(0, 3).map((a) => `- ${a.title}: ${a.description}`).join('\n')}`);
    }
  }

  if (wants.compare && secondary.length) {
    const other = secondary[0];
    parts.push(
      `**${primary.title} vs ${other.title}**\n- ${primary.title}: ${primary.summary}\n- ${other.title}: ${other.summary}\n\nThey differ mainly in ${primary.difficulty} vs ${other.difficulty} depth, and share ${primary.crossSubject.filter((c) => other.crossSubject.includes(c)).length || 'no'} cross-subject tags.`,
    );
  }

  if (wants.related) {
    const prereqs = primary.prerequisites.map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as KnowledgeNode[];
    if (prereqs.length) {
      parts.push(`**Study these first**\n${prereqs.slice(0, 4).map((n) => `- ${n.title}`).join('\n')}`);
    }
  }

  if (parts.length === 0) {
    parts.push(`### ${primary.title}\n${primary.summary}`);
    if (primary.keyPrinciples.length) parts.push(primary.keyPrinciples.slice(0, 3).map((p) => `- ${p}`).join('\n'));
    if (primary.theory.length) parts.push(primary.theory[0].body.slice(0, 800));
  }

  if (secondary.length) {
    parts.push(`**Related concepts in your map**\n${secondary.map((n) => `- ${nodeLine(n)}`).join('\n')}`);
  }

  parts.push('_Generated locally from your knowledge graph — no network request was made._');

  return {
    content: parts.join('\n\n'),
    label: 'retrieval',
    refs: [primary.id, ...secondary.map((n) => n.id)],
  };
}

export function Assistant() {
  const [draft, setDraft] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const confirm = useConfirm();

  const conversations = useApp((s) => s.conversations);
  const addConversation = useApp((s) => s.addConversation);
  const updateConversation = useApp((s) => s.updateConversation);
  const deleteConversation = useApp((s) => s.deleteConversation);
  const nodes = useApp((s) => s.nodes);
  const universes = useApp((s) => s.universes);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const progress = useApp((s) => s.progress);
  const settings = useApp((s) => s.settings);
  const toast = useApp((s) => s.toast);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const scope = useMemo(
    () => (activeUniverseId ? nodes.filter((n) => n.universeId === activeUniverseId) : nodes),
    [nodes, activeUniverseId],
  );

  const weakNodes = useMemo(
    () =>
      scope
        .filter((n) => progress[n.id]?.firstStudied && computeMastery(progress[n.id]) < 55)
        .slice(0, 3),
    [scope, progress],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [active?.messages.length, activeId]);

  const startConversation = () => {
    const id = uid('conv');
    const conv: AIConversation = {
      id,
      universeId: activeUniverseId,
      nodeId: null,
      title: 'New conversation',
      createdAt: new Date().toISOString(),
      messages: [],
    };
    addConversation(conv);
    setActiveId(id);
    return id;
  };

  const send = (text: string) => {
    const prompt = text.trim();
    if (!prompt) return;

    let conv = active;
    if (!conv) {
      const id = startConversation();
      conv = { ...useApp.getState().conversations.find((c) => c.id === id)! };
    }

    const userMessage = { id: uid('m'), role: 'user' as const, content: prompt, at: new Date().toISOString() };
    const reply = buildAnswer(prompt, nodes, scope);
    const assistantMessage = {
      id: uid('m'),
      role: 'assistant' as const,
      content: reply.content,
      at: new Date().toISOString(),
      label: reply.label,
    };

    const nextMessages = [...conv.messages, userMessage, assistantMessage];
    const title = conv.messages.length === 0 ? prompt.slice(0, 48) : conv.title;
    updateConversation(conv.id, { messages: nextMessages, title, universeId: activeUniverseId });
    setDraft('');
  };

  const removeConversation = async (id: string) => {
    const ok = await confirm({ title: 'Delete conversation?', description: 'The messages will be removed from this device.', danger: true });
    if (!ok) return;
    deleteConversation(id);
    if (activeId === id) setActiveId(null);
  };

  const copy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: 'Copied', tone: 'success' });
    } catch {
      toast({ title: 'Copy failed', description: 'Clipboard access was blocked.', tone: 'warn' });
    }
  };

  const providerLabel = settings.ai.enabled ? `${settings.ai.provider} · ${settings.ai.model}` : 'local demo mode';

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-[1300px] flex-col px-3 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Intelligence</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">AI Assistant</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={settings.ai.enabled ? 'ai' : 'neutral'}>
            <Sparkles size={9} /> {providerLabel}
          </Badge>
          <button onClick={startConversation} className="btn btn-primary h-8 text-[11px]">
            <Plus size={12} /> New chat
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[240px_1fr]">
        <Panel className="hidden min-h-0 flex-col overflow-hidden lg:flex">
          <div className="border-b border-[var(--line)] px-3 py-2.5">
            <p className="text-[11px] font-semibold">Conversations</p>
            <p className="text-[10px] text-muted">{conversations.length} saved locally</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {conversations.length === 0 ? (
              <p className="px-2 py-6 text-center text-[11px] text-muted">No conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    'group mb-1 flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors',
                    activeId === c.id ? 'bg-[var(--panel2)]' : 'hover:bg-[var(--panel2)]/60',
                  )}
                >
                  <button onClick={() => setActiveId(c.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[11px] font-medium">{c.title}</span>
                    <span className="block text-[10px] text-muted">
                      {c.messages.length} messages · {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    onClick={() => removeConversation(c.id)}
                    className="shrink-0 text-muted opacity-0 transition-opacity hover:text-[#FF8A9B] group-hover:opacity-100"
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {!active || active.messages.length === 0 ? (
              <div className="mx-auto max-w-lg py-6 text-center">
                <div
                  className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)]"
                  style={{ background: 'linear-gradient(135deg, rgba(54,214,255,0.16), rgba(145,102,255,0.16))' }}
                >
                  <BrainCircuit size={20} style={{ color: 'var(--ai)' }} />
                </div>
                <h2 className="mt-3 font-display text-base font-semibold">Ask your knowledge graph</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Answers are synthesized from {scope.length} concepts in the current universe. Definitions, formulas, worked examples and
                  cross-links are all retrievable.
                </p>

                <div className="mt-4 grid gap-1.5 text-left">
                  {[
                    'Explain gradient descent with the formula',
                    'What is the difference between supervised and unsupervised learning?',
                    'Give me a worked example of regularization',
                    'Which concepts should I revise first?',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 px-3 py-2 text-left text-[11px] transition-colors hover:border-[color-mix(in_srgb,var(--ai)_45%,var(--line))]"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {weakNodes.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="label mb-1">Weak concepts right now</p>
                    <div className="flex flex-wrap gap-1.5">
                      {weakNodes.map((n) => (
                        <button key={n.id} onClick={() => send(`Explain ${n.title}`)} className="chip">
                          {n.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto max-w-2xl space-y-4">
                <AnimatePresence initial={false}>
                  {active.messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex gap-2.5', m.role === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      {m.role === 'assistant' && (
                        <span
                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                          style={{ background: 'color-mix(in srgb, var(--ai) 18%, transparent)' }}
                        >
                          <Bot size={12} style={{ color: 'var(--ai)' }} />
                        </span>
                      )}
                      <div
                        className={cn(
                          'min-w-0 max-w-[85%] rounded-lg border px-3 py-2',
                          m.role === 'user' ? 'border-[var(--line)] bg-[var(--panel2)]' : 'border-[var(--line)] bg-[var(--panel)]',
                        )}
                      >
                        {m.role === 'assistant' ? (
                          <div
                            className="prose-nm text-[12px] leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-[12px] leading-relaxed">{m.content}</p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                          <span>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {m.label && m.role === 'assistant' && <Badge tone="ai">{m.label}</Badge>}
                          {m.role === 'assistant' && (
                            <button onClick={() => copy(m.content)} className="ml-auto hover:text-ink" aria-label="Copy answer">
                              <Copy size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                      {m.role === 'user' && (
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--line)]">
                          <User size={12} className="text-muted" />
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--line)] p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={1}
                placeholder="Ask about any concept, formula or connection..."
                className="input max-h-32 min-h-[38px] flex-1 resize-none py-2.5 text-[12px]"
                aria-label="Message"
              />
              <button type="submit" disabled={!draft.trim()} className="btn btn-ai h-[38px] !px-3 disabled:opacity-40">
                <ArrowUp size={14} />
              </button>
            </form>
            <p className="mt-1.5 text-[10px] text-muted">
              {settings.ai.enabled
                ? 'Remote provider configured — responses may use your endpoint.'
                : 'Local retrieval mode: answers come from your graph only. Configure a provider in Settings to change this.'}
            </p>
          </div>
        </Panel>
      </div>

      {universes.length > 1 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
          <span>Scope:</span>
          <span className="text-ink">{universes.find((u) => u.id === activeUniverseId)?.name ?? 'all universes'}</span>
          <span className="opacity-50">·</span>
          <Link to="/app/settings" className="text-[var(--accent)] hover:underline">
            change provider
          </Link>
        </div>
      )}
    </div>
  );
}

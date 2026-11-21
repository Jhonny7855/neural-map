import { create } from 'zustand';
import type {
  Achievement,
  AIConversation,
  Difficulty,
  EdgeType,
  GamificationState,
  HistoryEvent,
  KnowledgeEdge,
  KnowledgeNode,
  LearningPath,
  NodeProgress,
  QuizAttempt,
  Settings,
  SourceDocument,
  Universe,
  UserAchievement,
} from '@/types';
import { buildDemoUniverse, DEMO_UNIVERSE_ID } from '@/data/demo/builder';
import {
  ACHIEVEMENTS,
  QUESTS,
  applyAnswerToProgress,
  computeMastery,
  defaultProgress,
  deriveStatus,
  gradeAnswer,
  nextStreak,
  scheduleRevision,
} from '@/lib/learning';
import { KV, clearAllData, loadSnapshot, persistSnapshot, writeKV } from '@/lib/db';
import { clamp, slugify, todayKey, uid } from '@/lib/utils';

export const defaultSettings: Settings = {
  theme: 'neural-dark',
  motion: 'full',
  graphLayout: 'hierarchy',
  showMiniMap: true,
  animateEdges: true,
  snapToGrid: false,
  fontSize: 'base',
  dailyGoalMinutes: 30,
  revisionAlgorithm: 'sm2',
  notifications: { quests: true, revision: true, achievements: true },
  ai: {
    provider: 'demo',
    model: 'neural-map-demo',
    baseUrl: '',
    apiKey: '',
    temperature: 0.4,
    enabled: false,
  },
  profile: { name: 'Explorer', tagline: 'Mapping the unknown' },
  onboarded: false,
};

const emptyGamification: GamificationState = {
  xp: 0,
  streak: 0,
  lastActiveDay: null,
  unlocked: [],
  claimedQuests: {},
  sessions: [],
};

interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'warn' | 'error';
}

interface QuestProgress {
  current: number;
  target: number;
  complete: boolean;
}

interface AppState {
  ready: boolean;
  universes: Universe[];
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  progress: Record<string, NodeProgress>;
  sources: SourceDocument[];
  paths: LearningPath[];
  attempts: QuizAttempt[];
  history: HistoryEvent[];
  conversations: AIConversation[];
  achievements: UserAchievement[];
  gamification: GamificationState;
  settings: Settings;

  activeUniverseId: string | null;
  selectedNodeId: string | null;
  focusMode: boolean;
  toasts: Toast[];
  unlockedAchievement: Achievement | null;
  recentSearches: string[];

  persist: () => Promise<void>;
  init: () => Promise<void>;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  dismissAchievement: () => void;

  setActiveUniverse: (id: string | null) => void;
  selectNode: (id: string | null) => void;
  toggleFocusMode: (value?: boolean) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addRecentSearch: (q: string) => void;

  createUniverse: (input: { name: string; description: string; icon: string; color: string; tags?: string[] }) => string;
  updateUniverse: (id: string, patch: Partial<Universe>) => void;
  deleteUniverse: (id: string) => void;
  duplicateUniverse: (id: string) => string | null;
  importUniverse: (payload: { universe: Universe; nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }) => string;
  appendGraph: (payload: { universeId: string; nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }) => void;

  createNode: (input: {
    universeId: string;
    parentId: string | null;
    title: string;
    type: KnowledgeNode['type'];
    difficulty: Difficulty;
    summary?: string;
  }) => string;
  updateNode: (id: string, patch: Partial<KnowledgeNode>) => void;
  deleteNode: (id: string) => void;
  toggleCollapse: (id: string) => void;
  expandBranch: (id: string) => void;
  setNodePosition: (id: string, position: { x: number; y: number }) => void;
  createEdge: (input: { universeId: string; source: string; target: string; type: EdgeType; explanation: string }) => void;
  deleteEdge: (id: string) => void;

  ensureProgress: (nodeId: string) => NodeProgress;
  touchNode: (nodeId: string) => void;
  markTheoryRead: (nodeId: string) => void;
  recordAnswer: (nodeId: string, questionId: string, given: unknown) => { correct: boolean; correctAnswer: unknown; explanation: string };
  completeConceptTest: (nodeId: string, correctCount: number, total: number) => void;
  runRevision: (nodeId: string, quality: number) => void;
  addTimeSpent: (nodeId: string, ms: number) => void;

  saveAttempt: (attempt: QuizAttempt) => void;
  createPath: (input: {
    universeId: string;
    title: string;
    goal: string;
    nodeIds: string[];
    difficulty: Difficulty;
    minutesPerDay: number;
    durationDays: number;
  }) => string;
  updatePath: (id: string, patch: Partial<LearningPath>) => void;
  deletePath: (id: string) => void;
  togglePathStep: (pathId: string, nodeId: string) => void;
  skipPathStep: (pathId: string, nodeId: string) => void;
  reorderPathSteps: (pathId: string, from: number, to: number) => void;

  addSource: (doc: SourceDocument) => void;
  removeSource: (id: string) => void;
  addConversation: (conv: AIConversation) => void;
  updateConversation: (id: string, patch: Partial<AIConversation>) => void;
  deleteConversation: (id: string) => void;

  addXp: (amount: number, reason: string) => void;
  claimQuest: (questId: string) => void;
  questProgress: (questId: string) => QuestProgress;
  checkAchievement: (id: string, condition: boolean) => void;
  pushHistory: (event: Omit<HistoryEvent, 'id' | 'at'>) => void;
  resetAll: () => Promise<void>;
  exportSnapshot: () => unknown;
}

function progressMapFrom(list: NodeProgress[]) {
  const map: Record<string, NodeProgress> = {};
  for (const p of list) map[p.nodeId] = p;
  return map;
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  universes: [],
  nodes: [],
  edges: [],
  progress: {},
  sources: [],
  paths: [],
  attempts: [],
  history: [],
  conversations: [],
  achievements: [],
  gamification: emptyGamification,
  settings: defaultSettings,
  activeUniverseId: null,
  selectedNodeId: null,
  focusMode: false,
  toasts: [],
  unlockedAchievement: null,
  recentSearches: [],

  persist: async () => {
    const s = get();
    if (!s.ready) return;
    await persistSnapshot({
      universes: s.universes,
      nodes: s.nodes,
      edges: s.edges,
      progress: Object.values(s.progress),
      sources: s.sources,
      paths: s.paths,
      attempts: s.attempts,
      history: s.history,
      conversations: s.conversations,
      achievements: s.achievements,
      settings: s.settings,
      gamification: s.gamification,
    });
  },

  init: async () => {
    const snapshot = await loadSnapshot();
    if (!snapshot.universes.length) {
      const demo = buildDemoUniverse();
      set({
        universes: [demo.universe],
        nodes: demo.nodes,
        edges: demo.edges,
        progress: progressMapFrom(demo.progress),
        settings: defaultSettings,
        gamification: { ...emptyGamification, xp: 320, streak: 3, lastActiveDay: todayKey() },
        activeUniverseId: DEMO_UNIVERSE_ID,
        ready: true,
      });
      await writeKV(KV.seeded, true);
      await get().persist();
      return;
    }
    set({
      universes: snapshot.universes,
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      progress: progressMapFrom(snapshot.progress),
      sources: snapshot.sources,
      paths: snapshot.paths,
      attempts: snapshot.attempts,
      history: snapshot.history,
      conversations: snapshot.conversations,
      achievements: snapshot.achievements,
      settings: { ...defaultSettings, ...(snapshot.settings ?? {}) },
      gamification: { ...emptyGamification, ...(snapshot.gamification ?? {}) },
      activeUniverseId: snapshot.universes[0]?.id ?? null,
      ready: true,
    });
  },

  toast: (t) => {
    const id = uid('toast');
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => get().dismissToast(id), 4200);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  dismissAchievement: () => set({ unlockedAchievement: null }),

  setActiveUniverse: (id) => {
    const s = get();
    const previous = s.activeUniverseId;
    set({ activeUniverseId: id, selectedNodeId: null });
    if (id && id !== previous) {
      const universe = s.universes.find((u) => u.id === id);
      if (universe) get().pushHistory({ kind: 'universe', label: `Opened ${universe.name}`, universeId: id });
      const visited = s.gamification.unlocked.includes('universe-visit') ? s.gamification.unlocked : [...s.gamification.unlocked];
      const marker = `universe:${id}`;
      if (!visited.includes(marker)) {
        set((st) => ({ gamification: { ...st.gamification, unlocked: [...st.gamification.unlocked, marker] } }));
        const distinct = new Set(get().gamification.unlocked.filter((u) => u.startsWith('universe:')).map((u) => u.slice(9)));
        distinct.add(id);
        if (distinct.size >= 2) get().checkAchievement('a_universe3', get().universes.length >= 3);
      }
    }
    void get().persist();
  },

  selectNode: (id) => {
    const s = get();
    set({ selectedNodeId: id });
    if (!id) return;
    const node = s.nodes.find((n) => n.id === id);
    if (!node) return;
    get().touchNode(id);
    get().pushHistory({ kind: 'node-open', label: `Opened ${node.title}`, universeId: node.universeId, nodeId: id });
    get().checkAchievement('a_first_node', true);
    const discovered = Object.values(get().progress).filter((p) => p.firstStudied).length;
    if (discovered >= 10) get().checkAchievement('a_ten_nodes', true);
    if (discovered >= 50) get().checkAchievement('a_fifty_nodes', true);
  },

  toggleFocusMode: (value) => set((s) => ({ focusMode: value ?? !s.focusMode })),

  updateSettings: (patch) => {
    set((s) => ({ settings: { ...s.settings, ...patch } }));
    void get().persist();
  },

  addRecentSearch: (q) => {
    const query = q.trim();
    if (!query) return;
    set((s) => ({ recentSearches: [query, ...s.recentSearches.filter((r) => r !== query)].slice(0, 8) }));
  },

  createUniverse: ({ name, description, icon, color, tags = [] }) => {
    const id = uid('u');
    const rootId = uid('n');
    const now = new Date().toISOString();
    const root: KnowledgeNode = {
      id: rootId,
      universeId: id,
      parentId: null,
      title: name,
      slug: slugify(name),
      summary: description || `The root of ${name}.`,
      description: description || `The root of ${name}.`,
      type: 'universe',
      difficulty: 'beginner',
      objectives: ['Map the core concepts of this universe'],
      estimatedMinutes: 5,
      theory: [{ heading: 'About this universe', body: description || `You created ${name}. Add nodes to build the map.` }],
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
      sourceRefs: [],
      position: { x: 0, y: 0 },
      masteryScore: 0,
      created: now,
      updated: now,
    };
    const universe: Universe = {
      id,
      name,
      description,
      icon,
      color,
      rootNodeId: rootId,
      createdAt: now,
      updatedAt: now,
      sourceCount: 0,
      tags,
    };
    set((s) => ({
      universes: [...s.universes, universe],
      nodes: [...s.nodes, root],
      progress: { ...s.progress, [rootId]: defaultProgress(rootId, id, 'beginner') },
      activeUniverseId: id,
      selectedNodeId: rootId,
    }));
    get().pushHistory({ kind: 'universe', label: `Created ${name}`, universeId: id });
    if (get().universes.length >= 3) get().checkAchievement('a_universe3', true);
    void get().persist();
    return id;
  },

  updateUniverse: (id, patch) => {
    set((s) => ({
      universes: s.universes.map((u) => (u.id === id ? { ...u, ...patch, updatedAt: new Date().toISOString() } : u)),
    }));
    void get().persist();
  },

  deleteUniverse: (id) => {
    set((s) => {
      const nodeIds = new Set(s.nodes.filter((n) => n.universeId === id).map((n) => n.id));
      const progress = { ...s.progress };
      for (const nid of nodeIds) delete progress[nid];
      return {
        universes: s.universes.filter((u) => u.id !== id),
        nodes: s.nodes.filter((n) => n.universeId !== id),
        edges: s.edges.filter((e) => e.universeId !== id),
        sources: s.sources.filter((d) => d.universeId !== id),
        paths: s.paths.filter((p) => p.universeId !== id),
        attempts: s.attempts.filter((a) => a.universeId !== id),
        progress,
        activeUniverseId:
          s.activeUniverseId === id ? (s.universes.find((u) => u.id !== id)?.id ?? null) : s.activeUniverseId,
        selectedNodeId: s.selectedNodeId && nodeIds.has(s.selectedNodeId) ? null : s.selectedNodeId,
      };
    });
    void get().persist();
  },

  duplicateUniverse: (id) => {
    const s = get();
    const source = s.universes.find((u) => u.id === id);
    if (!source) return null;
    const newId = uid('u');
    const idMap = new Map<string, string>();
    const now = new Date().toISOString();
    const sourceNodes = s.nodes.filter((n) => n.universeId === id);
    const newNodes = sourceNodes.map((n) => {
      const newId2 = uid('n');
      idMap.set(n.id, newId2);
      return { ...n, id: newId2, universeId: newId, created: now, updated: now };
    });
    for (const n of newNodes) {
      n.parentId = n.parentId ? idMap.get(n.parentId) ?? null : null;
      n.prerequisites = n.prerequisites.map((p) => idMap.get(p) ?? p);
      n.related = n.related.map((p) => idMap.get(p) ?? p);
      n.extensions = n.extensions.map((p) => idMap.get(p) ?? p);
      n.contrasts = n.contrasts.map((p) => idMap.get(p) ?? p);
    }
    const newEdges = s.edges
      .filter((e) => e.universeId === id)
      .map((e) => ({
        ...e,
        id: uid('e'),
        universeId: newId,
        source: idMap.get(e.source) ?? e.source,
        target: idMap.get(e.target) ?? e.target,
      }));
    const universe: Universe = {
      ...source,
      id: newId,
      name: `${source.name} (copy)`,
      rootNodeId: idMap.get(source.rootNodeId) ?? source.rootNodeId,
      createdAt: now,
      updatedAt: now,
      demo: false,
    };
    const progress: Record<string, NodeProgress> = { ...s.progress };
    for (const [oldId, newId2] of idMap) {
      const p = s.progress[oldId];
      progress[newId2] = p ? { ...p, nodeId: newId2, universeId: newId } : defaultProgress(newId2, newId, 'beginner');
    }
    set({
      universes: [...s.universes, universe],
      nodes: [...s.nodes, ...newNodes],
      edges: [...s.edges, ...newEdges],
      progress,
      activeUniverseId: newId,
    });
    void get().persist();
    return newId;
  },

  importUniverse: ({ universe, nodes, edges }) => {
    const newUniverseId = uid('u');
    const idMap = new Map<string, string>();
    const now = new Date().toISOString();
    const newNodes = nodes.map((n) => {
      const nid = uid('n');
      idMap.set(n.id, nid);
      return { ...n, id: nid, universeId: newUniverseId, created: now, updated: now };
    });
    for (const n of newNodes) {
      n.parentId = n.parentId ? idMap.get(n.parentId) ?? null : null;
      n.prerequisites = n.prerequisites.map((p) => idMap.get(p) ?? p);
      n.related = n.related.map((p) => idMap.get(p) ?? p);
      n.extensions = n.extensions.map((p) => idMap.get(p) ?? p);
      n.contrasts = n.contrasts.map((p) => idMap.get(p) ?? p);
    }
    const newEdges = edges
      .filter((e) => idMap.has(e.source) && idMap.has(e.target))
      .map((e) => ({
        ...e,
        id: uid('e'),
        universeId: newUniverseId,
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
      }));
    const imported: Universe = {
      ...universe,
      id: newUniverseId,
      rootNodeId: idMap.get(universe.rootNodeId) ?? newNodes[0]?.id ?? '',
      createdAt: now,
      updatedAt: now,
      demo: false,
    };
    const progress: Record<string, NodeProgress> = { ...get().progress };
    for (const n of newNodes) progress[n.id] = defaultProgress(n.id, newUniverseId, n.difficulty);
    set((s) => ({
      universes: [...s.universes, imported],
      nodes: [...s.nodes, ...newNodes],
      edges: [...s.edges, ...newEdges],
      progress,
      activeUniverseId: newUniverseId,
      selectedNodeId: imported.rootNodeId,
    }));
    get().pushHistory({ kind: 'import', label: `Imported ${imported.name}`, universeId: newUniverseId });
    void get().persist();
    return newUniverseId;
  },

  appendGraph: ({ universeId, nodes, edges }) => {
    const now = new Date().toISOString();
    const nodeIds = new Set(get().nodes.map((n) => n.id));
    const addedNodes = nodes.map((n) => ({
      ...n,
      universeId,
      created: n.created || now,
      updated: now,
    }));
    for (const n of addedNodes) nodeIds.add(n.id);
    const addedEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    const progress: Record<string, NodeProgress> = { ...get().progress };
    for (const n of addedNodes) {
      if (!progress[n.id]) progress[n.id] = defaultProgress(n.id, universeId, n.difficulty);
    }
    set((s) => {
      const universe = s.universes.find((u) => u.id === universeId);
      const rootExists = universe ? nodeIds.has(universe.rootNodeId) : false;
      return {
        nodes: [...s.nodes, ...addedNodes],
        edges: [...s.edges, ...addedEdges],
        progress,
        universes: rootExists
          ? s.universes
          : s.universes.map((u) =>
              u.id === universeId ? { ...u, rootNodeId: addedNodes[0]?.id ?? u.rootNodeId, updatedAt: now } : u,
            ),
      };
    });
    void get().persist();
  },

  createNode: ({ universeId, parentId, title, type, difficulty, summary }) => {
    const id = uid('n');
    const now = new Date().toISOString();
    const parent = parentId ? get().nodes.find((n) => n.id === parentId) : null;
    const siblings = parent ? get().nodes.filter((n) => n.parentId === parent.id).length : 0;
    const node: KnowledgeNode = {
      id,
      universeId,
      parentId,
      title,
      slug: slugify(title),
      summary: summary || `A new ${type} in this universe.`,
      description: summary || `A new ${type} in this universe.`,
      type,
      difficulty,
      objectives: [],
      estimatedMinutes: 10,
      theory: summary ? [{ heading: 'Overview', body: summary }] : [],
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
      sourceRefs: [],
      position: parent
        ? { x: parent.position.x + 320, y: parent.position.y + siblings * 110 }
        : { x: 0, y: 0 },
      masteryScore: 0,
      created: now,
      updated: now,
    };
    const newEdges: KnowledgeEdge[] = parent
      ? [
          {
            id: uid('e'),
            universeId,
            source: parent.id,
            target: id,
            type: 'contains',
            explanation: `${title} is part of ${parent.title}.`,
            confidence: 1,
            discoveredAt: now,
          },
        ]
      : [];
    set((s) => ({
      nodes: [...s.nodes, node],
      edges: [...s.edges, ...newEdges],
      progress: { ...s.progress, [id]: defaultProgress(id, universeId, difficulty) },
      selectedNodeId: id,
    }));
    void get().persist();
    return id;
  },

  updateNode: (id, patch) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch, updated: new Date().toISOString() } : n)),
    }));
    void get().persist();
  },

  deleteNode: (id) => {
    set((s) => {
      const toDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of s.nodes) {
          if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
            toDelete.add(n.id);
            changed = true;
          }
        }
      }
      const progress = { ...s.progress };
      for (const nid of toDelete) delete progress[nid];
      return {
        nodes: s.nodes.filter((n) => !toDelete.has(n.id)),
        edges: s.edges.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)),
        progress,
        selectedNodeId: s.selectedNodeId && toDelete.has(s.selectedNodeId) ? null : s.selectedNodeId,
      };
    });
    void get().persist();
  },

  toggleCollapse: (id) => {
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, collapsed: !n.collapsed } : n)) }));
    void get().persist();
  },

  expandBranch: (id) => {
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, collapsed: false } : n)) }));
    const node = get().nodes.find((n) => n.id === id);
    if (node)
      get().pushHistory({ kind: 'branch-expand', label: `Expanded ${node.title}`, universeId: node.universeId, nodeId: id });
    void get().persist();
  },

  setNodePosition: (id, position) => {
    set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, position } : n)) }));
  },

  createEdge: ({ universeId, source, target, type, explanation }) => {
    const now = new Date().toISOString();
    const edge: KnowledgeEdge = {
      id: uid('e'),
      universeId,
      source,
      target,
      type,
      explanation,
      confidence: 1,
      custom: true,
      discoveredAt: now,
    };
    set((s) => ({ edges: [...s.edges, edge] }));
    const src = get().nodes.find((n) => n.id === source);
    const tgt = get().nodes.find((n) => n.id === target);
    get().pushHistory({
      kind: 'connection',
      label: `Connected ${src?.title ?? 'node'} \u2192 ${tgt?.title ?? 'node'}`,
      universeId,
      nodeId: source,
    });
    get().addXp(20, 'Discovered a connection');
    get().checkAchievement('a_connection', true);
    void get().persist();
  },

  deleteEdge: (id) => {
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) }));
    void get().persist();
  },

  ensureProgress: (nodeId) => {
    const existing = get().progress[nodeId];
    if (existing) return existing;
    const node = get().nodes.find((n) => n.id === nodeId);
    const p = defaultProgress(nodeId, node?.universeId ?? '', node?.difficulty ?? 'beginner');
    set((s) => ({ progress: { ...s.progress, [nodeId]: p } }));
    return p;
  },

  touchNode: (nodeId) => {
    const p = get().ensureProgress(nodeId);
    if (p.firstStudied) {
      set((s) => ({
        progress: { ...s.progress, [nodeId]: { ...p, lastStudied: new Date().toISOString() } },
      }));
      return;
    }
    const next: NodeProgress = {
      ...p,
      firstStudied: new Date().toISOString(),
      lastStudied: new Date().toISOString(),
      history: [...p.history, { at: new Date().toISOString(), type: 'discover', delta: 10 }],
    };
    next.mastery = computeMastery(next);
    next.status = deriveStatus(next);
    set((s) => ({ progress: { ...s.progress, [nodeId]: next } }));
    get().addXp(10, 'Discovered a concept');
    const discovered = Object.values(get().progress).filter((x) => x.firstStudied).length;
    if (discovered >= 10) get().checkAchievement('a_ten_nodes', true);
    if (discovered >= 50) get().checkAchievement('a_fifty_nodes', true);
  },

  markTheoryRead: (nodeId) => {
    const p = get().ensureProgress(nodeId);
    if (p.theoryRead) return;
    const next: NodeProgress = {
      ...p,
      theoryRead: true,
      understanding: clamp(p.understanding + 22),
      firstStudied: p.firstStudied ?? new Date().toISOString(),
      lastStudied: new Date().toISOString(),
      history: [...p.history, { at: new Date().toISOString(), type: 'theory', delta: 20 }],
    };
    next.mastery = computeMastery(next);
    next.status = deriveStatus(next);
    set((s) => ({ progress: { ...s.progress, [nodeId]: next } }));
    get().addXp(20, 'Completed theory');
  },

  recordAnswer: (nodeId, questionId, given) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    const question = node?.questions.find((q) => q.id === questionId);
    if (!node || !question) return { correct: false, correctAnswer: null, explanation: 'Question not found.' };
    const { correct, normalized } = gradeAnswer(question, given);
    const p = get().ensureProgress(nodeId);
    const next = applyAnswerToProgress(p, question, correct);
    set((s) => ({ progress: { ...s.progress, [nodeId]: next } }));
    get().addXp(
      correct ? (question.difficulty === 'beginner' || question.difficulty === 'intermediate' ? 10 : 25) : 2,
      correct ? 'Correct answer' : 'Attempted a question',
    );
    return { correct, correctAnswer: normalized, explanation: question.explanation };
  },

  completeConceptTest: (nodeId, correctCount, total) => {
    const p = get().ensureProgress(nodeId);
    const ratio = total ? correctCount / total : 0;
    const next: NodeProgress = {
      ...p,
      understanding: clamp(p.understanding + ratio * 12),
      recall: clamp(p.recall + ratio * 18),
      practice: clamp(p.practice + ratio * 16),
      consistency: clamp(p.consistency + 8),
      lastStudied: new Date().toISOString(),
      quizAttempts: p.quizAttempts + total,
      quizCorrect: p.quizCorrect + correctCount,
      history: [
        ...p.history,
        { at: new Date().toISOString(), type: 'concept-test', delta: 50, note: `${correctCount}/${total}` },
      ],
    };
    next.mastery = computeMastery(next);
    next.status = deriveStatus(next);
    if (next.mastery >= 85) {
      next.revisionDue = new Date(Date.now() + 3 * 86_400_000).toISOString();
      next.intervalDays = Math.max(next.intervalDays, 3);
    }
    set((s) => ({ progress: { ...s.progress, [nodeId]: next } }));
    get().addXp(50, 'Completed a concept test');
    if (next.status === 'mastered') {
      get().addXp(100, 'Mastered a concept');
      get().checkAchievement('a_first_mastery', true);
      const mastered = Object.values(get().progress).filter((x) => x.status === 'mastered').length;
      if (mastered >= 5) get().checkAchievement('a_five_mastery', true);
    }
  },

  runRevision: (nodeId, quality) => {
    const p = get().ensureProgress(nodeId);
    const next = scheduleRevision(p, quality);
    set((s) => ({ progress: { ...s.progress, [nodeId]: next } }));
    get().addXp(quality >= 3 ? 25 : 8, 'Revision session');
    void get().persist();
  },

  addTimeSpent: (nodeId, ms) => {
    const p = get().ensureProgress(nodeId);
    const next: NodeProgress = { ...p, timeSpentMs: p.timeSpentMs + ms, lastStudied: new Date().toISOString() };
    set((s) => ({ progress: { ...s.progress, [nodeId]: next } }));
  },

  saveAttempt: (attempt) => {
    set((s) => ({ attempts: [attempt, ...s.attempts].slice(0, 60) }));
    get().pushHistory({
      kind: 'test',
      label: `${attempt.title} \u2014 ${attempt.correct}/${attempt.total}`,
      universeId: attempt.universeId,
    });
    get().checkAchievement('a_first_quiz', true);
    if (attempt.total > 0 && attempt.correct === attempt.total) get().checkAchievement('a_perfect_quiz', true);
    void get().persist();
  },

  createPath: ({ universeId, title, goal, nodeIds, difficulty, minutesPerDay, durationDays }) => {
    const id = uid('p');
    const path: LearningPath = {
      id,
      universeId,
      title,
      goal,
      difficulty,
      minutesPerDay,
      durationDays,
      steps: nodeIds.map((nodeId, index) => ({ nodeId, order: index, completed: false, skipped: false })),
      createdAt: new Date().toISOString(),
      active: true,
    };
    set((s) => ({ paths: [path, ...s.paths.map((p) => ({ ...p, active: false }))] }));
    get().pushHistory({ kind: 'path', label: `Created path "${title}"`, universeId });
    get().checkAchievement('a_path', true);
    void get().persist();
    return id;
  },

  updatePath: (id, patch) => {
    set((s) => ({ paths: s.paths.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    void get().persist();
  },

  deletePath: (id) => {
    set((s) => ({ paths: s.paths.filter((p) => p.id !== id) }));
    void get().persist();
  },

  togglePathStep: (pathId, nodeId) => {
    const path = get().paths.find((p) => p.id === pathId);
    const step = path?.steps.find((st) => st.nodeId === nodeId);
    const willComplete = step ? !step.completed : false;
    set((s) => ({
      paths: s.paths.map((p) =>
        p.id === pathId
          ? { ...p, steps: p.steps.map((st) => (st.nodeId === nodeId ? { ...st, completed: !st.completed } : st)) }
          : p,
      ),
    }));
    if (willComplete) get().addXp(15, 'Completed a path step');
    void get().persist();
  },

  skipPathStep: (pathId, nodeId) => {
    set((s) => ({
      paths: s.paths.map((p) =>
        p.id === pathId ? { ...p, steps: p.steps.map((st) => (st.nodeId === nodeId ? { ...st, skipped: !st.skipped } : st)) } : p,
      ),
    }));
    void get().persist();
  },

  reorderPathSteps: (pathId, from, to) => {
    set((s) => ({
      paths: s.paths.map((p) => {
        if (p.id !== pathId) return p;
        const steps = [...p.steps];
        if (from < 0 || from >= steps.length || to < 0 || to >= steps.length) return p;
        const [moved] = steps.splice(from, 1);
        steps.splice(to, 0, moved);
        return { ...p, steps: steps.map((st, i) => ({ ...st, order: i })) };
      }),
    }));
    void get().persist();
  },

  addSource: (doc) => {
    set((s) => ({ sources: [doc, ...s.sources] }));
    set((s) => ({
      universes: s.universes.map((u) => (u.id === doc.universeId ? { ...u, sourceCount: u.sourceCount + 1 } : u)),
    }));
    get().checkAchievement('a_import', true);
    void get().persist();
  },

  removeSource: (id) => {
    const doc = get().sources.find((d) => d.id === id);
    set((s) => ({ sources: s.sources.filter((d) => d.id !== id) }));
    if (doc) {
      set((s) => ({
        universes: s.universes.map((u) =>
          u.id === doc.universeId ? { ...u, sourceCount: Math.max(0, u.sourceCount - 1) } : u,
        ),
      }));
    }
    void get().persist();
  },

  addConversation: (conv) => {
    set((s) => ({ conversations: [conv, ...s.conversations].slice(0, 40) }));
    void get().persist();
  },

  updateConversation: (id, patch) => {
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    void get().persist();
  },

  deleteConversation: (id) => {
    set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) }));
    void get().persist();
  },

  addXp: (amount, reason) => {
    const s = get();
    const streakResult = nextStreak(s.gamification.lastActiveDay, s.gamification.streak);
    const today = todayKey();
    const sessions = [...s.gamification.sessions];
    const existing = sessions.find((x) => x.day === today);
    if (existing) existing.xp += amount;
    else sessions.push({ day: today, minutes: 0, xp: amount });
    const nextGamification: GamificationState = {
      ...s.gamification,
      xp: s.gamification.xp + amount,
      streak: streakResult.streak,
      lastActiveDay: today,
      sessions: sessions.slice(-90),
    };
    set({ gamification: nextGamification });
    if (streakResult.changed && streakResult.streak > 1 && s.settings.notifications.quests) {
      get().toast({ title: `${streakResult.streak}-day streak`, description: reason, tone: 'success' });
    }
    get().checkAchievement('a_xp1000', nextGamification.xp >= 1000);
    get().checkAchievement('a_streak3', nextGamification.streak >= 3);
    get().checkAchievement('a_streak7', nextGamification.streak >= 7);
  },

  questProgress: (questId) => {
    const quest = QUESTS.find((q) => q.id === questId);
    const s = get();
    if (!quest) return { current: 0, target: 1, complete: false };
    const progressList = Object.values(s.progress);
    let current = 0;
    switch (quest.metric as string) {
      case 'discover':
        current = progressList.filter((p) => p.firstStudied).length;
        break;
      case 'master':
        current = progressList.filter((p) => p.status === 'mastered').length;
        break;
      case 'questions':
        current = progressList.reduce((acc, p) => acc + p.quizCorrect, 0);
        break;
      case 'connections':
        current = s.edges.filter((e) => e.custom).length;
        break;
      case 'revision':
        current = progressList.reduce((acc, p) => acc + p.revisionCount, 0);
        break;
      case 'branch': {
        const byParent = new Map<string, NodeProgress[]>();
        for (const n of s.nodes) {
          if (!n.parentId) continue;
          const p = s.progress[n.id];
          if (!p) continue;
          const arr = byParent.get(n.parentId) ?? [];
          arr.push(p);
          byParent.set(n.parentId, arr);
        }
        let branches = 0;
        for (const arr of byParent.values()) {
          if (arr.length >= 2 && arr.every((p) => p.theoryRead && p.quizCorrect > 0)) branches++;
        }
        current = branches;
        break;
      }
      case 'universe':
        current = s.gamification.unlocked.filter((u) => u.startsWith('universe:')).length;
        break;
      case 'xp':
        current = s.gamification.xp;
        break;
      default:
        current = 0;
    }
    return { current, target: quest.target, complete: current >= quest.target };
  },

  claimQuest: (questId) => {
    const quest = QUESTS.find((q) => q.id === questId);
    if (!quest) return;
    const s = get();
    if (s.gamification.claimedQuests[questId]) return;
    if (!get().questProgress(questId).complete) return;
    set((st) => ({
      gamification: {
        ...st.gamification,
        xp: st.gamification.xp + quest.rewardXp,
        claimedQuests: { ...st.gamification.claimedQuests, [questId]: Date.now() },
      },
    }));
    get().toast({ title: 'Quest complete', description: `${quest.title} \u2014 +${quest.rewardXp} XP`, tone: 'success' });
    void get().persist();
  },

  checkAchievement: (id, condition) => {
    if (!condition) return;
    const s = get();
    if (s.achievements.some((a) => a.achievementId === id)) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    const record: UserAchievement = { achievementId: id, unlockedAt: new Date().toISOString() };
    set({ achievements: [...s.achievements, record], unlockedAchievement: def as Achievement });
    if (s.settings.notifications.achievements) {
      get().toast({ title: 'Achievement unlocked', description: def.title, tone: 'success' });
    }
  },

  pushHistory: (event) => {
    const record: HistoryEvent = { ...event, id: uid('h'), at: new Date().toISOString() };
    set((s) => ({ history: [record, ...s.history].slice(0, 500) }));
  },

  resetAll: async () => {
    await clearAllData();
    const demo = buildDemoUniverse();
    set({
      universes: [demo.universe],
      nodes: demo.nodes,
      edges: demo.edges,
      progress: progressMapFrom(demo.progress),
      sources: [],
      paths: [],
      attempts: [],
      history: [],
      conversations: [],
      achievements: [],
      gamification: { ...emptyGamification },
      settings: defaultSettings,
      activeUniverseId: DEMO_UNIVERSE_ID,
      selectedNodeId: null,
      focusMode: false,
      recentSearches: [],
    });
    await writeKV(KV.seeded, true);
    await get().persist();
  },

  exportSnapshot: () => {
    const s = get();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      universes: s.universes,
      nodes: s.nodes,
      edges: s.edges,
      progress: Object.values(s.progress),
      sources: s.sources.map(({ text, ...rest }) => rest),
      paths: s.paths,
      attempts: s.attempts,
      history: s.history,
      achievements: s.achievements,
      gamification: s.gamification,
      settings: { ...s.settings, ai: { ...s.settings.ai, apiKey: '' } },
    };
  },
}));

export const selectActiveUniverse = (s: AppState) => s.universes.find((u) => u.id === s.activeUniverseId) ?? null;
export const selectUniverseNodes = (s: AppState) =>
  s.activeUniverseId ? s.nodes.filter((n) => n.universeId === s.activeUniverseId) : [];
export const selectUniverseEdges = (s: AppState) =>
  s.activeUniverseId ? s.edges.filter((e) => e.universeId === s.activeUniverseId) : [];
export const selectSelectedNode = (s: AppState) => s.nodes.find((n) => n.id === s.selectedNodeId) ?? null;

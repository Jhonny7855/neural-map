import Dexie, { type Table } from 'dexie';
import type {
  AIConversation,
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

class NeuralMapDB extends Dexie {
  universes!: Table<Universe, string>;
  nodes!: Table<KnowledgeNode, string>;
  edges!: Table<KnowledgeEdge, string>;
  progress!: Table<NodeProgress, string>;
  sources!: Table<SourceDocument, string>;
  paths!: Table<LearningPath, string>;
  attempts!: Table<QuizAttempt, string>;
  history!: Table<HistoryEvent, string>;
  conversations!: Table<AIConversation, string>;
  achievements!: Table<UserAchievement, string>;
  kv!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('neural-map');
    this.version(1).stores({
      universes: 'id, name, updatedAt',
      nodes: 'id, universeId, parentId, type, title',
      edges: 'id, universeId, source, target, type',
      progress: 'nodeId, universeId, status, revisionDue',
      sources: 'id, universeId, createdAt',
      paths: 'id, universeId, active',
      attempts: 'id, universeId, startedAt',
      history: 'id, at, kind, universeId',
      conversations: 'id, universeId, nodeId, createdAt',
      achievements: 'achievementId, unlockedAt',
      kv: 'key',
    });
  }
}

export const db = new NeuralMapDB();

export async function readKV<T>(key: string): Promise<T | null> {
  const row = await db.kv.get(key);
  return (row?.value as T) ?? null;
}

export async function writeKV(key: string, value: unknown) {
  await db.kv.put({ key, value });
}

export const KV = {
  settings: 'settings',
  gamification: 'gamification',
  seeded: 'seeded-v1',
} as const;

export async function clearAllData() {
  await Promise.all([
    db.universes.clear(),
    db.nodes.clear(),
    db.edges.clear(),
    db.progress.clear(),
    db.sources.clear(),
    db.paths.clear(),
    db.attempts.clear(),
    db.history.clear(),
    db.conversations.clear(),
    db.achievements.clear(),
    db.kv.clear(),
  ]);
}

export interface PersistPayload {
  universes: Universe[];
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  progress: NodeProgress[];
  sources: SourceDocument[];
  paths: LearningPath[];
  attempts: QuizAttempt[];
  history: HistoryEvent[];
  conversations: AIConversation[];
  achievements: UserAchievement[];
  settings: Settings;
  gamification: GamificationState;
}

/** Writes a full snapshot, replacing collections that changed. */
export async function persistSnapshot(payload: PersistPayload) {
  await db.transaction(
    'rw',
    [db.universes, db.nodes, db.edges, db.progress, db.sources, db.paths, db.attempts, db.history, db.conversations, db.achievements, db.kv],
    async () => {
      await db.universes.clear();
      await db.universes.bulkPut(payload.universes);
      await db.nodes.clear();
      await db.nodes.bulkPut(payload.nodes);
      await db.edges.clear();
      await db.edges.bulkPut(payload.edges);
      await db.progress.clear();
      await db.progress.bulkPut(payload.progress);
      await db.sources.clear();
      await db.sources.bulkPut(payload.sources.map(({ text, ...rest }) => rest as SourceDocument));
      await db.paths.clear();
      await db.paths.bulkPut(payload.paths);
      await db.attempts.clear();
      await db.attempts.bulkPut(payload.attempts);
      await db.history.clear();
      await db.history.bulkPut(payload.history.slice(0, 600));
      await db.conversations.clear();
      await db.conversations.bulkPut(payload.conversations);
      await db.achievements.clear();
      await db.achievements.bulkPut(payload.achievements);
      await writeKV(KV.settings, payload.settings);
      await writeKV(KV.gamification, payload.gamification);
    },
  );
}

export async function loadSnapshot() {
  const [universes, nodes, edges, progress, sources, paths, attempts, history, conversations, achievements, settings, gamification] =
    await Promise.all([
      db.universes.toArray(),
      db.nodes.toArray(),
      db.edges.toArray(),
      db.progress.toArray(),
      db.sources.toArray(),
      db.paths.toArray(),
      db.attempts.toArray(),
      db.history.toArray(),
      db.conversations.toArray(),
      db.achievements.toArray(),
      readKV<Settings>(KV.settings),
      readKV<GamificationState>(KV.gamification),
    ]);
  return {
    universes,
    nodes,
    edges,
    progress,
    sources,
    paths,
    attempts,
    history,
    conversations,
    achievements,
    settings,
    gamification,
  };
}

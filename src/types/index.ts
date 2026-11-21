export type NodeType =
  | 'universe'
  | 'subject'
  | 'topic'
  | 'concept'
  | 'advanced'
  | 'formula'
  | 'example'
  | 'question'
  | 'application'
  | 'challenge';

export type NodeStatus =
  | 'locked'
  | 'unexplored'
  | 'discovered'
  | 'learning'
  | 'practicing'
  | 'mastered'
  | 'needs-revision';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type QuestionType =
  | 'mcq'
  | 'multi'
  | 'truefalse'
  | 'numeric'
  | 'short'
  | 'match'
  | 'assertion'
  | 'code'
  | 'scenario';

export interface TheorySection {
  heading: string;
  body: string;
}

export interface KeyDefinition {
  term: string;
  meaning: string;
}

export interface WorkedExample {
  level: 'beginner' | 'practical' | 'advanced';
  title: string;
  problem: string;
  solution: string;
}

export interface Formula {
  name: string;
  expression: string;
  variables: { symbol: string; meaning: string }[];
  derivation?: string;
  example?: string;
  whenToUse?: string;
  mistakes?: string[];
}

export interface Application {
  title: string;
  description: string;
  industry?: string;
}

export interface VisualSpec {
  kind: 'flow' | 'bars' | 'curve' | 'matrix' | 'stack' | 'list';
  title: string;
  caption?: string;
  points?: { label: string; value: number }[];
  steps?: string[];
  matrix?: { rows: string[]; cols: string[]; values: number[][] };
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  difficulty: Difficulty;
  options?: QuestionOption[];
  /** index list for mcq/multi, boolean string for truefalse, number for numeric, text for short */
  answer: string | string[] | number | boolean;
  explanation: string;
  tolerance?: number;
  pairs?: MatchPair[];
  language?: string;
  starter?: string;
  conceptId?: string;
  xp?: number;
}

export interface SourceRef {
  documentId?: string;
  documentName: string;
  chapter?: string;
  page?: number;
  paragraph?: string;
  url?: string;
  quote?: string;
}

export interface KnowledgeNode {
  id: string;
  universeId: string;
  parentId: string | null;
  title: string;
  slug: string;
  summary: string;
  description: string;
  type: NodeType;
  difficulty: Difficulty;
  importance?: string;
  objectives: string[];
  estimatedMinutes: number;
  theory: TheorySection[];
  definitions: KeyDefinition[];
  keyPrinciples: string[];
  visuals: VisualSpec[];
  examples: WorkedExample[];
  formulas: Formula[];
  applications: Application[];
  questions: Question[];
  prerequisites: string[];
  related: string[];
  extensions: string[];
  contrasts: string[];
  crossSubject: string[];
  sourceRefs: SourceRef[];
  position: { x: number; y: number };
  masteryScore: number;
  created: string;
  updated: string;
  collapsed?: boolean;
}

export type EdgeType =
  | 'prerequisite'
  | 'similarity'
  | 'mathematical'
  | 'application'
  | 'extension'
  | 'contrast'
  | 'shared-principle'
  | 'historical'
  | 'cross-disciplinary'
  | 'contains';

export interface KnowledgeEdge {
  id: string;
  universeId: string;
  source: string;
  target: string;
  type: EdgeType;
  explanation: string;
  confidence: number;
  evidence?: string;
  custom?: boolean;
  discoveredAt: string;
}

export interface Universe {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rootNodeId: string;
  createdAt: string;
  updatedAt: string;
  sourceCount: number;
  demo?: boolean;
  tags: string[];
}

export interface NodeProgress {
  nodeId: string;
  universeId: string;
  status: NodeStatus;
  mastery: number;
  understanding: number;
  recall: number;
  practice: number;
  consistency: number;
  firstStudied: string | null;
  lastStudied: string | null;
  timeSpentMs: number;
  revisionCount: number;
  quizAttempts: number;
  quizCorrect: number;
  confidence: number;
  difficulty: Difficulty;
  theoryRead: boolean;
  incorrectQuestions: string[];
  revisionDue: string | null;
  intervalDays: number;
  ease: number;
  history: { at: string; type: string; delta: number; note?: string }[];
}

export interface SourceDocument {
  id: string;
  universeId: string;
  name: string;
  kind: string;
  size: number;
  pageCount?: number;
  extractedChars: number;
  createdAt: string;
  status: 'processing' | 'ready' | 'error';
  error?: string;
  textPreview: string;
  text?: string;
  mapping: string;
}

export interface LearningPathStep {
  nodeId: string;
  order: number;
  completed: boolean;
  skipped: boolean;
  note?: string;
}

export interface LearningPath {
  id: string;
  universeId: string;
  title: string;
  goal: string;
  difficulty: Difficulty;
  minutesPerDay: number;
  durationDays: number;
  steps: LearningPathStep[];
  createdAt: string;
  active: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  universeId: string;
  title: string;
  mode: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  total: number;
  correct: number;
  score: number;
  answers: {
    questionId: string;
    nodeId: string;
    prompt: string;
    given: unknown;
    correct: boolean;
    correctAnswer: unknown;
    explanation: string;
  }[];
}

export interface Quiz {
  id: string;
  universeId: string;
  title: string;
  mode: string;
  nodeIds: string[];
  questionIds: string[];
  createdAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  metric: 'discover' | 'master' | 'questions' | 'connections' | 'branch' | 'revision' | 'universe' | 'xp';
  rewardXp: number;
  active: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'neural';
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
}

export interface AIConversation {
  id: string;
  universeId: string | null;
  nodeId: string | null;
  title: string;
  createdAt: string;
  messages: { id: string; role: 'user' | 'assistant'; content: string; at: string; label?: string }[];
}

export interface HistoryEvent {
  id: string;
  at: string;
  kind: 'node-open' | 'branch-expand' | 'test' | 'connection' | 'universe' | 'session' | 'revision' | 'import' | 'path';
  label: string;
  universeId?: string;
  nodeId?: string;
  meta?: Record<string, unknown>;
}

export type ThemeName = 'neural-dark' | 'deep-space' | 'midnight' | 'light';

export interface AIProviderConfig {
  provider: 'demo' | 'openai-compatible' | 'ollama' | 'custom';
  model: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
  enabled: boolean;
}

export interface Settings {
  theme: ThemeName;
  motion: 'full' | 'reduced';
  graphLayout: 'hierarchy' | 'radial' | 'organic';
  showMiniMap: boolean;
  animateEdges: boolean;
  snapToGrid: boolean;
  fontSize: 'sm' | 'base' | 'lg';
  dailyGoalMinutes: number;
  revisionAlgorithm: 'sm2' | 'simple';
  notifications: { quests: boolean; revision: boolean; achievements: boolean };
  ai: AIProviderConfig;
  profile: { name: string; tagline: string };
  onboarded: boolean;
}

export interface GamificationState {
  xp: number;
  streak: number;
  lastActiveDay: string | null;
  unlocked: string[];
  claimedQuests: Record<string, number>;
  sessions: { day: string; minutes: number; xp: number }[];
}

export interface AppSnapshot {
  universes: Universe[];
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  progress: NodeProgress[];
  sources: SourceDocument[];
  paths: LearningPath[];
  attempts: QuizAttempt[];
  history: HistoryEvent[];
  conversations: AIConversation[];
  gamification: GamificationState;
  settings: Settings;
  achievements: UserAchievement[];
}

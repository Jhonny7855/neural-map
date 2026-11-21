import type { Difficulty, NodeProgress, NodeStatus, Question } from '@/types';
import { clamp, difficultyWeight, todayKey } from './utils';

export function defaultProgress(nodeId: string, universeId: string, difficulty: Difficulty): NodeProgress {
  return {
    nodeId,
    universeId,
    status: 'unexplored',
    mastery: 0,
    understanding: 0,
    recall: 0,
    practice: 0,
    consistency: 0,
    firstStudied: null,
    lastStudied: null,
    timeSpentMs: 0,
    revisionCount: 0,
    quizAttempts: 0,
    quizCorrect: 0,
    confidence: 0,
    difficulty,
    theoryRead: false,
    incorrectQuestions: [],
    revisionDue: null,
    intervalDays: 0,
    ease: 2.5,
    history: [],
  };
}

/**
 * Mastery is a weighted blend of independent signals. Opening a node contributes
 * nothing on its own: understanding requires theory completion, recall requires
 * correct retrievals, practice requires graded questions.
 */
export function computeMastery(p: NodeProgress): number {
  const accuracy = p.quizAttempts > 0 ? p.quizCorrect / p.quizAttempts : 0;
  const practiceSignal = clamp(p.practice * 0.7 + accuracy * 30, 0, 100);
  const consistencySignal = clamp(p.consistency, 0, 100);
  const raw =
    p.understanding * 0.3 + p.recall * 0.3 + practiceSignal * 0.28 + consistencySignal * 0.12;
  const diffPenalty = 1 / difficultyWeight(p.difficulty) ** 0.35;
  return Math.round(clamp(raw * diffPenalty));
}

export function deriveStatus(p: NodeProgress): NodeStatus {
  const m = computeMastery(p);
  if (p.status === 'locked') return 'locked';
  if (m >= 85 && p.revisionCount >= 1) return 'mastered';
  if (p.revisionDue && new Date(p.revisionDue).getTime() < Date.now() && m > 0 && m < 85) return 'needs-revision';
  if (m >= 55) return 'practicing';
  if (m > 0) return 'learning';
  if (p.firstStudied) return 'discovered';
  return 'unexplored';
}

/** SM-2 style scheduler with gentle adaptation for short sessions. */
export function scheduleRevision(p: NodeProgress, quality: number): NodeProgress {
  const q = clamp(quality, 0, 5);
  let ease = p.ease || 2.5;
  let interval = p.intervalDays || 0;

  if (q < 3) {
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    if (interval === 0) interval = 1;
    else if (interval === 1) interval = 3;
    else interval = Math.round(interval * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * 0.08));
  }

  interval = clamp(interval, 1, 120);
  const due = new Date(Date.now() + interval * 86_400_000).toISOString();

  const recallGain = q >= 4 ? 14 : q === 3 ? 8 : 2;
  const next: NodeProgress = {
    ...p,
    ease,
    intervalDays: interval,
    revisionCount: p.revisionCount + 1,
    lastStudied: new Date().toISOString(),
    revisionDue: due,
    recall: clamp(p.recall + recallGain),
    consistency: clamp(p.consistency + 6),
  };
  next.mastery = computeMastery(next);
  next.status = deriveStatus(next);
  next.history = [
    ...p.history.slice(-40),
    { at: new Date().toISOString(), type: 'revision', delta: recallGain, note: `recall quality ${q}/5` },
  ];
  return next;
}

export function forgettingRisk(p: NodeProgress): number {
  if (!p.lastStudied || p.revisionCount === 0) return p.theoryRead ? 60 : 80;
  const daysSince = (Date.now() - new Date(p.lastStudied).getTime()) / 86_400_000;
  const strength = Math.max(1, p.intervalDays * (p.ease / 2.5));
  const decay = 1 - Math.exp(-daysSince / strength);
  const masteryBuffer = (100 - computeMastery(p)) / 100;
  return Math.round(clamp(decay * 70 + masteryBuffer * 30 + (p.incorrectQuestions.length ? 8 : 0)));
}

export function isDue(p: NodeProgress) {
  if (!p.revisionDue) return false;
  return new Date(p.revisionDue).getTime() <= Date.now() + 86_400_000;
}

export function isOverdue(p: NodeProgress) {
  if (!p.revisionDue) return false;
  return new Date(p.revisionDue).getTime() < Date.now() - 86_400_000;
}

export function gradeAnswer(question: Question, given: unknown): { correct: boolean; normalized: unknown } {
  const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

  switch (question.type) {
    case 'mcq': {
      const idx = typeof given === 'number' ? given : Number(given);
      return { correct: String(idx) === String(question.answer), normalized: question.answer };
    }
    case 'multi': {
      const givenArr = Array.isArray(given) ? [...given].map(String).sort() : [];
      const ansArr = Array.isArray(question.answer) ? [...question.answer].map(String).sort() : [];
      return { correct: JSON.stringify(givenArr) === JSON.stringify(ansArr), normalized: ansArr };
    }
    case 'truefalse': {
      return { correct: Boolean(given) === Boolean(question.answer), normalized: question.answer };
    }
    case 'numeric': {
      const num = Number(given);
      const target = Number(question.answer);
      const tol = question.tolerance ?? Math.max(0.01, Math.abs(target) * 0.01);
      return { correct: Number.isFinite(num) && Math.abs(num - target) <= tol, normalized: target };
    }
    case 'match': {
      const givenPairs = Array.isArray(given) ? given : [];
      const expected = question.pairs ?? [];
      const correct =
        expected.length === givenPairs.length &&
        expected.every((p, i) => norm(p.right) === norm((givenPairs[i] as { right?: string })?.right));
      return { correct, normalized: expected };
    }
    case 'code':
    case 'short':
    case 'scenario': {
      const text = String(given ?? '').toLowerCase();
      const answers = Array.isArray(question.answer) ? question.answer.map((a) => String(a).toLowerCase()) : [String(question.answer).toLowerCase()];
      const keywords = answers.flatMap((a) => a.split(/[|,]/)).map((s) => s.trim()).filter(Boolean);
      const hits = keywords.filter((k) => text.includes(k)).length;
      const threshold = Math.max(1, Math.ceil(keywords.length * 0.5));
      return { correct: hits >= threshold, normalized: question.answer };
    }
    case 'assertion': {
      return { correct: norm(given) === norm(question.answer), normalized: question.answer };
    }
    default:
      return { correct: false, normalized: question.answer };
  }
}

export function applyAnswerToProgress(
  p: NodeProgress,
  question: Question,
  correct: boolean,
): NodeProgress {
  const xp = correct ? (question.difficulty === 'beginner' || question.difficulty === 'intermediate' ? 10 : 25) : 2;
  const next: NodeProgress = {
    ...p,
    quizAttempts: p.quizAttempts + 1,
    quizCorrect: p.quizCorrect + (correct ? 1 : 0),
    practice: clamp(p.practice + (correct ? (question.difficulty === 'expert' ? 16 : 11) : 3)),
    understanding: clamp(p.understanding + (correct ? 2 : 0.5)),
    lastStudied: new Date().toISOString(),
    incorrectQuestions: correct
      ? p.incorrectQuestions.filter((id) => id !== question.id)
      : Array.from(new Set([...p.incorrectQuestions, question.id])),
    history: [
      ...p.history.slice(-40),
      { at: new Date().toISOString(), type: 'quiz', delta: xp, note: correct ? 'correct answer' : 'incorrect answer' },
    ],
  };
  next.mastery = computeMastery(next);
  next.status = deriveStatus(next);
  return next;
}

export const QUESTS = [
  { id: 'q_discover10', title: 'Scout the Terrain', description: 'Discover 10 concepts', target: 10, metric: 'discover', rewardXp: 75, active: true },
  { id: 'q_branch', title: 'Close the Loop', description: 'Complete one knowledge branch', target: 1, metric: 'branch', rewardXp: 75, active: true },
  { id: 'q_questions20', title: 'Sharpen the Edge', description: 'Solve 20 questions', target: 20, metric: 'questions', rewardXp: 75, active: true },
  { id: 'q_master5', title: 'Deep Encoding', description: 'Master 5 concepts', target: 5, metric: 'master', rewardXp: 100, active: true },
  { id: 'q_connections3', title: 'Bridge Builder', description: 'Discover 3 cross-topic connections', target: 3, metric: 'connections', rewardXp: 75, active: true },
  { id: 'q_revision', title: 'Memory Keeper', description: 'Complete a revision session', target: 1, metric: 'revision', rewardXp: 50, active: true },
  { id: 'q_universe', title: 'New Frontier', description: 'Explore a new universe', target: 1, metric: 'universe', rewardXp: 50, active: true },
] as const;

export const ACHIEVEMENTS = [
  { id: 'a_first_node', title: 'First Contact', description: 'Open your first concept', icon: 'sparkles', tier: 'bronze' },
  { id: 'a_ten_nodes', title: 'Cartographer', description: 'Discover 10 concepts', icon: 'map', tier: 'bronze' },
  { id: 'a_fifty_nodes', title: 'Deep Surveyor', description: 'Discover 50 concepts', icon: 'compass', tier: 'silver' },
  { id: 'a_first_mastery', title: 'Crystallized', description: 'Master your first concept', icon: 'gem', tier: 'silver' },
  { id: 'a_five_mastery', title: 'Solid State', description: 'Master 5 concepts', icon: 'hexagon', tier: 'gold' },
  { id: 'a_first_quiz', title: 'Calibrated', description: 'Complete your first test', icon: 'target', tier: 'bronze' },
  { id: 'a_perfect_quiz', title: 'Flawless Run', description: 'Score 100% on a test', icon: 'trophy', tier: 'gold' },
  { id: 'a_streak3', title: 'Momentum', description: 'Reach a 3-day streak', icon: 'flame', tier: 'bronze' },
  { id: 'a_streak7', title: 'Compounding', description: 'Reach a 7-day streak', icon: 'flame', tier: 'gold' },
  { id: 'a_connection', title: 'Synapse', description: 'Discover your first connection', icon: 'link', tier: 'bronze' },
  { id: 'a_import', title: 'Assimilator', description: 'Import a document into a universe', icon: 'upload', tier: 'silver' },
  { id: 'a_lab', title: 'Experimentalist', description: 'Run a Mind Lab experiment', icon: 'flask', tier: 'silver' },
  { id: 'a_path', title: 'Guided', description: 'Generate a learning path', icon: 'route', tier: 'bronze' },
  { id: 'a_universe3', title: 'Multiverse', description: 'Own 3 knowledge universes', icon: 'orbit', tier: 'gold' },
  { id: 'a_xp1000', title: 'Neural Density', description: 'Earn 1000 XP', icon: 'zap', tier: 'neural' },
] as const;

export function nextStreak(lastActiveDay: string | null, currentStreak: number): { streak: number; changed: boolean } {
  const today = todayKey();
  if (lastActiveDay === today) return { streak: currentStreak, changed: false };
  if (!lastActiveDay) return { streak: 1, changed: true };
  const diffDays = Math.round((new Date(today).getTime() - new Date(lastActiveDay).getTime()) / 86_400_000);
  if (diffDays === 1) return { streak: currentStreak + 1, changed: true };
  return { streak: 1, changed: true };
}

import type {
  Difficulty,
  EdgeType,
  KnowledgeEdge,
  KnowledgeNode,
  NodeProgress,
  Question,
  Universe,
} from '@/types';
import { slugify, uid } from '@/lib/utils';
import { defaultProgress, computeMastery, deriveStatus } from '@/lib/learning';
import { foundationSpecs } from './foundations';
import { supervisedSpecs } from './supervised';
import { unsupervisedSpecs } from './unsupervised';
import { deepSpecs } from './deep';
import { trainingSpecs } from './training';
import { evaluationSpecs } from './evaluation';
import { extraSpecs } from './extra';
import type { NodeSpec, RawQuestion } from './types';

const ALL_SPECS: NodeSpec[] = [
  ...foundationSpecs,
  ...supervisedSpecs,
  ...unsupervisedSpecs,
  ...deepSpecs,
  ...trainingSpecs,
  ...evaluationSpecs,
  ...extraSpecs,
];

export const DEMO_UNIVERSE_ID = 'u_ml_galaxy';

const COLUMN_WIDTH = 340;
const ROW_GAP = 26;

function depthOf(spec: NodeSpec, byId: Map<string, NodeSpec>): number {
  let depth = 0;
  let current: NodeSpec | undefined = spec;
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(current.id)) {
    seen.add(current.id);
    current = byId.get(current.parentId);
    if (current) depth++;
    if (depth > 20) break;
  }
  return depth;
}

function convertQuestion(raw: RawQuestion, nodeId: string, index: number): Question {
  const id = `${nodeId}__q${index + 1}`;
  const base: Question = {
    id,
    type: raw.type,
    prompt: raw.prompt,
    difficulty: raw.difficulty ?? 'intermediate',
    answer: raw.answer,
    explanation: raw.explanation,
    conceptId: nodeId,
  };
  if (raw.options) {
    base.options = raw.options.map((text, i) => ({ id: String(i), text }));
  }
  if (raw.tolerance !== undefined) base.tolerance = raw.tolerance;
  if (raw.pairs) base.pairs = raw.pairs;
  if (raw.language) base.language = raw.language;
  if (raw.starter) base.starter = raw.starter;
  if (raw.xp !== undefined) base.xp = raw.xp;
  return base;
}

export function buildDemoUniverse(): {
  universe: Universe;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  progress: NodeProgress[];
} {
  const now = new Date().toISOString();
  const byId = new Map(ALL_SPECS.map((s) => [s.id, s]));
  const validIds = new Set(ALL_SPECS.map((s) => s.id));

  const keep = (ids: string[] | undefined) => (ids ?? []).filter((id) => validIds.has(id));

  const groups = new Map<number, NodeSpec[]>();
  for (const spec of ALL_SPECS) {
    const depth = depthOf(spec, byId);
    const bucket = groups.get(depth) ?? [];
    bucket.push(spec);
    groups.set(depth, bucket);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const sortedDepths = [...groups.keys()].sort((a, b) => a - b);
  for (const depth of sortedDepths) {
    const bucket = groups.get(depth)!;
    const ordered = [...bucket].sort((a, b) => {
      const pa = a.parentId ? positions.get(a.parentId)?.y ?? 0 : 0;
      const pb = b.parentId ? positions.get(b.parentId)?.y ?? 0 : 0;
      return pa - pb || a.title.localeCompare(b.title);
    });
    ordered.forEach((spec, index) => {
      positions.set(spec.id, { x: depth * COLUMN_WIDTH, y: index * (140 + ROW_GAP) });
    });
  }

  const nodes: KnowledgeNode[] = ALL_SPECS.map((spec) => {
    const mastery = spec.mastery ?? 0;
    return {
      id: spec.id,
      universeId: DEMO_UNIVERSE_ID,
      parentId: spec.parentId,
      title: spec.title,
      slug: slugify(spec.title),
      summary: spec.summary,
      description: spec.description ?? spec.summary,
      type: spec.type,
      difficulty: spec.difficulty,
      importance: spec.importance,
      objectives: spec.objectives ?? [],
      estimatedMinutes: spec.minutes ?? 12,
      theory: (spec.theory ?? []).map(([heading, body]) => ({ heading, body })),
      definitions: (spec.definitions ?? []).map(([term, meaning]) => ({ term, meaning })),
      keyPrinciples: spec.principles ?? [],
      visuals: (spec.visuals ?? []).map((v) => ({
        kind: v.kind,
        title: v.title,
        caption: v.caption,
        points: v.values?.map(([label, value]) => ({ label, value })),
        steps: v.steps,
        matrix: v.matrix,
      })),
      examples: spec.examples ?? [],
      formulas: (spec.formulas ?? []).map((f) => ({
        name: f.name,
        expression: f.expression,
        variables: f.variables.map(([symbol, meaning]) => ({ symbol, meaning })),
        derivation: f.derivation,
        example: f.example,
        whenToUse: f.whenToUse,
        mistakes: f.mistakes,
      })),
      applications: spec.applications ?? [],
      questions: (spec.questions ?? []).map((q, i) => convertQuestion(q, spec.id, i)),
      prerequisites: keep(spec.prerequisites),
      related: keep(spec.related),
      extensions: keep(spec.extensions),
      contrasts: keep(spec.contrasts),
      crossSubject: spec.crossSubject ?? [],
      sourceRefs: [
        {
          documentName: 'Machine Learning Galaxy — authored reference set',
          chapter: 'Demo universe',
          paragraph: 'Content authored for the NEURAL MAP demo; no external document is claimed.',
        },
      ],
      position: positions.get(spec.id) ?? { x: 0, y: 0 },
      masteryScore: mastery,
      created: now,
      updated: now,
    };
  });

  const edges: KnowledgeEdge[] = [];
  const seen = new Set<string>();
  const addEdge = (source: string, target: string, type: EdgeType, explanation: string, confidence = 0.95) => {
    if (!validIds.has(source) || !validIds.has(target) || source === target) return;
    const key = `${source}->${target}:${type}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({
      id: `e_${edges.length + 1}_${slugify(type)}`,
      universeId: DEMO_UNIVERSE_ID,
      source,
      target,
      type,
      explanation,
      confidence,
      discoveredAt: now,
    });
  };

  for (const spec of ALL_SPECS) {
    if (spec.parentId && validIds.has(spec.parentId)) {
      addEdge(spec.parentId, spec.id, 'contains', `${spec.title} is a ${spec.type} inside ${byId.get(spec.parentId)!.title}.`, 1);
    }
  }

  for (const spec of ALL_SPECS) {
    for (const prereq of keep(spec.prerequisites)) {
      addEdge(prereq, spec.id, 'prerequisite', `${byId.get(prereq)!.title} provides the foundation needed for ${spec.title}.`, 0.97);
    }
    for (const rel of keep(spec.related)) {
      addEdge(spec.id, rel, 'similarity', `${spec.title} and ${byId.get(rel)!.title} are studied together and share reasoning patterns.`, 0.8);
    }
    for (const ext of keep(spec.extensions)) {
      addEdge(spec.id, ext, 'extension', `${byId.get(ext)!.title} extends the ideas introduced in ${spec.title}.`, 0.85);
    }
    for (const con of keep(spec.contrasts)) {
      addEdge(spec.id, con, 'contrast', `${spec.title} is often contrasted with ${byId.get(con)!.title}; comparing them sharpens both.`, 0.75);
    }
  }

  const curated: [string, string, EdgeType, string][] = [
    ['linear-algebra', 'pca', 'mathematical', 'PCA is an eigen-decomposition of the covariance matrix — it is linear algebra applied directly.',],
    ['probability', 'naive-bayes', 'mathematical', 'Naive Bayes is Bayes\u2019 rule plus a conditional independence assumption.'],
    ['calculus', 'gradient-descent', 'mathematical', 'Gradient descent is the chain rule plus a step rule; every update needs a derivative.'],
    ['statistics', 'bias-variance', 'shared-principle', 'The bias–variance decomposition is an MSE decomposition from statistics.'],
    ['linear-regression', 'neural-networks', 'extension', 'A single neuron with identity activation is linear regression.'],
    ['logistic-regression', 'neural-networks', 'extension', 'A single neuron with a sigmoid is logistic regression.'],
    ['knn', 'embeddings', 'application', 'Embedding search is k-NN over learned vectors rather than raw features.'],
    ['pca', 'embeddings', 'shared-principle', 'Both produce dense low-dimensional representations, one linear and one learned.'],
    ['decision-trees', 'random-forest', 'extension', 'A random forest is an ensemble of decorrelated decision trees.'],
    ['overfitting', 'regularization', 'application', 'Regularisation is the primary remedy for overfitting.'],
    ['cross-validation', 'model-evaluation', 'application', 'Cross-validation is the standard protocol for estimating generalisation.'],
    ['gradient-descent', 'loss-functions', 'mathematical', 'Gradient descent needs a differentiable loss to define the descent direction.'],
    ['precision-recall', 'classification', 'application', 'Precision and recall are the primary metrics for classification decisions.'],
    ['svm', 'linear-algebra', 'mathematical', 'The maximum-margin hyperplane is defined by a normal vector and an inner product.'],
    ['transformers', 'embeddings', 'application', 'Transformer token embeddings are the lookup tables attention operates over.'],
    ['cnn', 'transformers', 'contrast', 'CNNs build in locality and translation equivariance; transformers use global attention instead.'],
    ['kmeans', 'pca', 'application', 'PCA before k-Means often improves clustering by removing noise directions.'],
    ['feature-scaling', 'gradient-descent', 'application', 'Scaling conditions the loss surface and makes gradient descent converge faster.'],
    ['statistics', 'cross-validation', 'shared-principle', 'Cross-validation is a resampling estimator of the sampling distribution of performance.'],
    ['deep-learning', 'overfitting', 'contrast', 'Deep networks have enormous capacity, which makes overfitting control essential.'],
  ];
  for (const [s, t, type, explanation] of curated) {
    addEdge(s, t, type, explanation, 0.9);
  }

  const progress: NodeProgress[] = nodes.map((node) => {
    const base = defaultProgress(node.id, DEMO_UNIVERSE_ID, node.difficulty);
    if (!node.masteryScore) return base;
    const p: NodeProgress = {
      ...base,
      understanding: Math.min(100, node.masteryScore * 1.05),
      recall: Math.min(100, node.masteryScore * 0.95),
      practice: Math.min(100, node.masteryScore * 0.9),
      consistency: Math.min(100, node.masteryScore * 0.8),
      theoryRead: node.masteryScore > 30,
      firstStudied: new Date(Date.now() - 12 * 86_400_000).toISOString(),
      lastStudied: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      timeSpentMs: Math.round(node.masteryScore * 45_000),
      revisionCount: node.masteryScore > 40 ? 2 : 0,
      quizAttempts: Math.round(node.masteryScore / 20),
      quizCorrect: Math.round((node.masteryScore / 20) * 0.85),
      confidence: Math.round(node.masteryScore * 0.9),
      intervalDays: node.masteryScore > 40 ? 6 : 0,
      revisionDue:
        node.masteryScore > 40
          ? new Date(Date.now() + (node.masteryScore > 70 ? 5 : 1) * 86_400_000).toISOString()
          : null,
    };
    p.mastery = computeMastery(p);
    p.status = deriveStatus(p);
    return p;
  });

  const universe: Universe = {
    id: DEMO_UNIVERSE_ID,
    name: 'Machine Learning Galaxy',
    description:
      'A complete map of machine learning: from linear algebra and probability through regression, deep learning, and model evaluation.',
    icon: 'brain-circuit',
    color: '#36D6FF',
    rootNodeId: 'ml-root',
    createdAt: now,
    updatedAt: now,
    sourceCount: 1,
    demo: true,
    tags: ['machine learning', 'statistics', 'deep learning'],
  };

  return { universe, nodes, edges, progress };
}

export function sampleMastery(seed: number) {
  const states: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  return states[seed % states.length];
}

export { ALL_SPECS };

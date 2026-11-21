import { z } from 'zod';

export const nodeTypeSchema = z.enum([
  'universe',
  'subject',
  'topic',
  'concept',
  'advanced',
  'formula',
  'example',
  'question',
  'application',
  'challenge',
]);

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

export const edgeTypeSchema = z.enum([
  'prerequisite',
  'similarity',
  'mathematical',
  'application',
  'extension',
  'contrast',
  'shared-principle',
  'historical',
  'cross-disciplinary',
  'contains',
]);

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(['mcq', 'multi', 'truefalse', 'numeric', 'short', 'match', 'assertion', 'code', 'scenario']),
  prompt: z.string(),
  difficulty: difficultySchema,
  options: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  answer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
  explanation: z.string(),
  tolerance: z.number().optional(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
  language: z.string().optional(),
  starter: z.string().optional(),
  conceptId: z.string().optional(),
  xp: z.number().optional(),
});

export const knowledgeNodeSchema = z.object({
  id: z.string().min(1),
  universeId: z.string().min(1),
  parentId: z.string().nullable(),
  title: z.string().min(1),
  slug: z.string(),
  summary: z.string(),
  description: z.string(),
  type: nodeTypeSchema,
  difficulty: difficultySchema,
  importance: z.string().optional(),
  objectives: z.array(z.string()),
  estimatedMinutes: z.number(),
  theory: z.array(z.object({ heading: z.string(), body: z.string() })),
  definitions: z.array(z.object({ term: z.string(), meaning: z.string() })),
  keyPrinciples: z.array(z.string()),
  visuals: z.array(
    z.object({
      kind: z.enum(['flow', 'bars', 'curve', 'matrix', 'stack', 'list']),
      title: z.string(),
      caption: z.string().optional(),
      points: z.array(z.object({ label: z.string(), value: z.number() })).optional(),
      steps: z.array(z.string()).optional(),
      matrix: z
        .object({ rows: z.array(z.string()), cols: z.array(z.string()), values: z.array(z.array(z.number())) })
        .optional(),
    }),
  ),
  examples: z.array(
    z.object({
      level: z.enum(['beginner', 'practical', 'advanced']),
      title: z.string(),
      problem: z.string(),
      solution: z.string(),
    }),
  ),
  formulas: z.array(
    z.object({
      name: z.string(),
      expression: z.string(),
      variables: z.array(z.object({ symbol: z.string(), meaning: z.string() })),
      derivation: z.string().optional(),
      example: z.string().optional(),
      whenToUse: z.string().optional(),
      mistakes: z.array(z.string()).optional(),
    }),
  ),
  applications: z.array(z.object({ title: z.string(), description: z.string(), industry: z.string().optional() })),
  questions: z.array(questionSchema),
  prerequisites: z.array(z.string()),
  related: z.array(z.string()),
  extensions: z.array(z.string()),
  contrasts: z.array(z.string()),
  crossSubject: z.array(z.string()),
  sourceRefs: z.array(
    z.object({
      documentId: z.string().optional(),
      documentName: z.string(),
      chapter: z.string().optional(),
      page: z.number().optional(),
      paragraph: z.string().optional(),
      url: z.string().optional(),
      quote: z.string().optional(),
    }),
  ),
  position: z.object({ x: z.number(), y: z.number() }),
  masteryScore: z.number(),
  created: z.string(),
  updated: z.string(),
  collapsed: z.boolean().optional(),
});

export const universeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  description: z.string().max(600),
  icon: z.string(),
  color: z.string(),
  rootNodeId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceCount: z.number(),
  demo: z.boolean().optional(),
  tags: z.array(z.string()),
});

export const edgeSchema = z.object({
  id: z.string(),
  universeId: z.string(),
  source: z.string(),
  target: z.string(),
  type: edgeTypeSchema,
  explanation: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.string().optional(),
  custom: z.boolean().optional(),
  discoveredAt: z.string(),
});

export const importGraphSchema = z.object({
  version: z.number().optional(),
  universe: universeSchema,
  nodes: z.array(knowledgeNodeSchema).min(1),
  edges: z.array(edgeSchema),
});

export type ImportGraph = z.infer<typeof importGraphSchema>;

export function validateImportGraph(raw: unknown): { ok: true; data: ImportGraph } | { ok: false; error: string } {
  const parsed = importGraphSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: `${first.path.join('.') || 'root'}: ${first.message}` };
  }
  const nodeIds = new Set(parsed.data.nodes.map((n) => n.id));
  if (!nodeIds.has(parsed.data.universe.rootNodeId)) {
    return { ok: false, error: 'universe.rootNodeId does not match any node id' };
  }
  const badEdge = parsed.data.edges.find((e) => !nodeIds.has(e.source) || !nodeIds.has(e.target));
  if (badEdge) {
    return { ok: false, error: `edge ${badEdge.id} references a missing node` };
  }
  return { ok: true, data: parsed.data };
}

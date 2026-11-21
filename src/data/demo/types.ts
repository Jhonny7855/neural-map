import type { Difficulty, NodeType, QuestionType } from '@/types';

export interface RawQuestion {
  type: QuestionType;
  prompt: string;
  difficulty?: Difficulty;
  options?: string[];
  answer: string | string[] | number | boolean;
  explanation: string;
  tolerance?: number;
  pairs?: { left: string; right: string }[];
  language?: string;
  starter?: string;
  xp?: number;
}

export interface NodeSpec {
  id: string;
  title: string;
  parentId: string | null;
  type: NodeType;
  difficulty: Difficulty;
  summary: string;
  description?: string;
  minutes?: number;
  importance?: string;
  objectives?: string[];
  theory?: [string, string][];
  definitions?: [string, string][];
  principles?: string[];
  formulas?: {
    name: string;
    expression: string;
    variables: [string, string][];
    derivation?: string;
    example?: string;
    whenToUse?: string;
    mistakes?: string[];
  }[];
  examples?: { level: 'beginner' | 'practical' | 'advanced'; title: string; problem: string; solution: string }[];
  applications?: { title: string; description: string; industry?: string }[];
  questions?: RawQuestion[];
  prerequisites?: string[];
  related?: string[];
  extensions?: string[];
  contrasts?: string[];
  crossSubject?: string[];
  visuals?: {
    kind: 'flow' | 'bars' | 'curve' | 'matrix' | 'stack' | 'list';
    title: string;
    caption?: string;
    values?: [string, number][];
    steps?: string[];
    matrix?: { rows: string[]; cols: string[]; values: number[][] };
  }[];
  mastery?: number;
}

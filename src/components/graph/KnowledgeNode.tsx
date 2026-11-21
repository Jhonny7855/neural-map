import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Atom,
  Binary,
  BookOpen,
  CircleDot,
  FlaskConical,
  FunctionSquare,
  Globe2,
  HelpCircle,
  Lightbulb,
  Puzzle,
  Rocket,
  Sigma,
  Sparkles,
  Target,
} from 'lucide-react';
import type { KnowledgeNode, NodeProgress, NodeType } from '@/types';
import { cn } from '@/lib/utils';

export const TYPE_META: Record<NodeType, { label: string; icon: typeof Atom; color: string }> = {
  universe: { label: 'Universe', icon: Globe2, color: '#36D6FF' },
  subject: { label: 'Subject', icon: BookOpen, color: '#5BA8FF' },
  topic: { label: 'Topic', icon: Binary, color: '#7B8CFF' },
  concept: { label: 'Concept', icon: CircleDot, color: '#9166FF' },
  advanced: { label: 'Advanced', icon: Rocket, color: '#B47BFF' },
  formula: { label: 'Formula', icon: Sigma, color: '#FFB86B' },
  example: { label: 'Example', icon: Lightbulb, color: '#FFD66B' },
  question: { label: 'Question', icon: HelpCircle, color: '#5BE7A9' },
  application: { label: 'Application', icon: Target, color: '#4FD1C5' },
  challenge: { label: 'Challenge', icon: Puzzle, color: '#FF6B81' },
};

export const STATUS_META: Record<string, { label: string; color: string }> = {
  locked: { label: 'Locked', color: '#4A5568' },
  unexplored: { label: 'Unexplored', color: '#5A6782' },
  discovered: { label: 'Discovered', color: '#36D6FF' },
  learning: { label: 'Learning', color: '#5BA8FF' },
  practicing: { label: 'Practicing', color: '#9166FF' },
  mastered: { label: 'Mastered', color: '#5BE7A9' },
  'needs-revision': { label: 'Needs revision', color: '#FFB86B' },
};

export interface GraphNodeData extends Record<string, unknown> {
  node: KnowledgeNode;
  progress?: NodeProgress;
  mastery: number;
  status: string;
  dimmed: boolean;
  highlighted: boolean;
  hasChildren: boolean;
  collapsed: boolean;
  childCount: number;
}

function KnowledgeNodeCard({ data, selected }: NodeProps) {
  const d = data as GraphNodeData;
  const meta = TYPE_META[d.node.type] ?? TYPE_META.concept;
  const statusMeta = STATUS_META[d.status] ?? STATUS_META.unexplored;
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'group relative w-[216px] cursor-pointer rounded-xl border px-3 py-2.5 transition-all duration-200',
        selected && 'ring-1',
        d.dimmed && 'opacity-25',
      )}
      style={{
        background: 'color-mix(in srgb, var(--panel) 94%, transparent)',
        borderColor: d.highlighted || selected ? meta.color : 'var(--line)',
        boxShadow: selected
          ? `0 0 0 1px ${meta.color}, 0 0 26px -6px ${meta.color}88`
          : d.highlighted
            ? `0 0 20px -8px ${meta.color}99`
            : '0 8px 22px -16px rgba(0,0,0,0.9)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: meta.color }} />
      <Handle type="source" position={Position.Right} style={{ background: meta.color }} />

      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
          style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
        >
          <Icon size={11} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] font-semibold leading-tight">{d.node.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted">
            <span style={{ color: meta.color }}>{meta.label}</span>
            <span className="opacity-40">·</span>
            <span>{d.node.difficulty}</span>
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${d.mastery}%`, background: statusMeta.color }}
          />
        </div>
        <span className="font-mono text-[9px]" style={{ color: statusMeta.color }}>
          {d.mastery}%
        </span>
      </div>

      {d.hasChildren && (
        <span
          className="absolute -right-1.5 top-1/2 flex h-4 min-w-4 -translate-y-1/2 items-center justify-center rounded-full px-1 font-mono text-[8px] font-bold"
          style={{
            background: d.collapsed ? 'var(--panel2)' : 'color-mix(in srgb, var(--accent) 18%, var(--panel2))',
            border: `1px solid ${d.collapsed ? 'var(--line)' : 'color-mix(in srgb, var(--accent) 45%, var(--line))'}`,
            color: d.collapsed ? 'var(--muted)' : 'var(--accent)',
          }}
          title={d.collapsed ? `${d.childCount} hidden children — click to expand` : 'Click to collapse branch'}
        >
          {d.childCount}
        </span>
      )}

      {d.status === 'needs-revision' && (
        <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full" style={{ background: '#FFB86B', boxShadow: '0 0 8px #FFB86B' }} />
      )}
      {d.status === 'mastered' && (
        <span className="absolute -left-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full text-[7px] font-bold" style={{ background: 'var(--mastery)', color: '#04121b' }}>
          ✓
        </span>
      )}
    </div>
  );
}

export const GraphNodeComponent = memo(KnowledgeNodeCard);

export function NodeLegend() {
  const types: NodeType[] = ['universe', 'subject', 'topic', 'concept', 'advanced'];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {types.map((t) => {
        const meta = TYPE_META[t];
        return (
          <span key={t} className="flex items-center gap-1 text-[9px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

export const EdgeLegend = () => (
  <div className="flex flex-wrap items-center gap-2">
    {[
      ['contains', 'Contains', '#5A6782'],
      ['prerequisite', 'Prerequisite', '#36D6FF'],
      ['similarity', 'Related', '#9166FF'],
      ['contrast', 'Contrast', '#FF6B81'],
    ].map(([id, label, color]) => (
      <span key={id} className="flex items-center gap-1 text-[9px] text-muted">
        <span className="h-[2px] w-4 rounded-full" style={{ background: color }} />
        {label}
      </span>
    ))}
  </div>
);

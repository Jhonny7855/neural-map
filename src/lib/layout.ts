import dagre from 'dagre';
import type { KnowledgeEdge, KnowledgeNode } from '@/types';

export type LayoutName = 'hierarchy' | 'radial' | 'organic';

const NODE_W = 216;
const NODE_H = 72;

export function hierarchyLayout(nodes: KnowledgeNode[], edges: KnowledgeEdge[], direction: 'LR' | 'TB' = 'LR') {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 26, ranksep: 130, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });

  const structural = edges.filter((e) => e.type === 'contains' || e.type === 'prerequisite');
  const used = new Set<string>();
  for (const e of structural) {
    if (!g.hasNode(e.source) || !g.hasNode(e.target)) continue;
    const key = `${e.source}|${e.target}`;
    if (used.has(key)) continue;
    used.add(key);
    g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const pos = g.node(n.id);
    positions.set(n.id, { x: (pos?.x ?? 0) - NODE_W / 2, y: (pos?.y ?? 0) - NODE_H / 2 });
  }
  return positions;
}

export function radialLayout(nodes: KnowledgeNode[], rootId: string) {
  const positions = new Map<string, { x: number; y: number }>();
  const childrenOf = new Map<string, KnowledgeNode[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const arr = childrenOf.get(n.parentId) ?? [];
    arr.push(n);
    childrenOf.set(n.parentId, arr);
  }

  const root = nodes.find((n) => n.id === rootId) ?? nodes[0];
  if (!root) return positions;

  positions.set(root.id, { x: 0, y: 0 });
  const placed = new Set<string>([root.id]);

  const level = [root];
  let radius = 300;
  const perRing = 12;
  let ring = 0;
  let slot = 0;

  while (level.length) {
    const next: KnowledgeNode[] = [];
    const ringItems: KnowledgeNode[] = [];
    for (const parent of level) {
      const kids = childrenOf.get(parent.id) ?? [];
      for (const kid of kids) {
        if (placed.has(kid.id)) continue;
        placed.add(kid.id);
        next.push(kid);
        ringItems.push(kid);
      }
    }
    if (!ringItems.length) break;
    ring += 1;
    radius = 300 + ring * 250;
    ringItems.forEach((node, i) => {
      const total = Math.max(perRing, ringItems.length);
      const angle = (i / total) * Math.PI * 2 + (slot * Math.PI) / total;
      positions.set(node.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.68,
      });
    });
    slot += 1;
    level.length = 0;
    level.push(...next);
  }

  return positions;
}

export function organicLayout(nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
  const positions = new Map<string, { x: number; y: number }>();
  const adjacency = new Map<string, string[]>();
  for (const n of nodes) adjacency.set(n.id, []);
  for (const e of edges) {
    adjacency.get(e.source)?.push(e.target);
    adjacency.get(e.target)?.push(e.source);
  }

  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const placed: { id: string; x: number; y: number }[] = [];

  for (const node of nodes) {
    const i = index.get(node.id) ?? 0;
    const baseAngle = i * 2.399963;
    const dist = 120 + Math.sqrt(i) * 150;
    placed.push({
      id: node.id,
      x: Math.cos(baseAngle) * dist,
      y: Math.sin(baseAngle) * dist * 0.75,
    });
  }

  const posById = new Map(placed.map((p) => [p.id, p]));
  for (let iter = 0; iter < 160; iter++) {
    const cooling = 1 - iter / 160;
    for (const a of placed) {
      let fx = 0;
      let fy = 0;
      for (const b of placed) {
        if (a === b) continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          d2 = 1;
        }
        const d = Math.sqrt(d2);
        const repel = 26000 / d2;
        fx += (dx / d) * repel;
        fy += (dy / d) * repel;
      }
      for (const neighbourId of adjacency.get(a.id) ?? []) {
        const b = posById.get(neighbourId);
        if (!b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const spring = (d - 240) * 0.02;
        fx += (dx / d) * spring;
        fy += (dy / d) * spring;
      }
      a.x += fx * cooling;
      a.y += fy * cooling;
    }
  }

  for (const p of placed) positions.set(p.id, { x: p.x, y: p.y });
  return positions;
}

export function computeLayout(name: LayoutName, nodes: KnowledgeNode[], edges: KnowledgeEdge[], rootId: string) {
  if (name === 'radial') return radialLayout(nodes, rootId);
  if (name === 'organic') return organicLayout(nodes, edges);
  return hierarchyLayout(nodes, edges);
}

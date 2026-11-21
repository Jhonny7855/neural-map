import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel as FlowPanel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Eye,
  EyeOff,
  Filter,
  Focus,
  GitBranch,
  LayoutGrid,
  ListFilter,
  Maximize2,
  Redo2,
  Search,
  Sparkles,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useApp } from '@/store/app';
import { GraphNodeComponent, TYPE_META, STATUS_META, EdgeLegend, type GraphNodeData } from '@/components/graph/KnowledgeNode';
import { computeLayout, type LayoutName } from '@/lib/layout';
import { computeMastery, forgettingRisk } from '@/lib/learning';
import { cn, fuzzyMatch } from '@/lib/utils';
import { Badge, ProgressBar, Tooltip } from '@/components/ui';
import type { Difficulty, EdgeType, KnowledgeEdge, KnowledgeNode, NodeStatus, NodeType } from '@/types';

const nodeTypes = { knowledge: GraphNodeComponent };

const EDGE_COLORS: Record<string, string> = {
  contains: 'rgba(90,103,130,0.5)',
  prerequisite: '#36D6FF',
  similarity: '#9166FF',
  application: '#4FD1C5',
  extension: '#B47BFF',
  contrast: '#FF6B81',
  mathematical: '#FFB86B',
  'shared-principle': '#5BE7A9',
  historical: '#8B97AD',
  'cross-disciplinary': '#FFD66B',
};

interface HistoryEntry {
  selected: string | null;
  layout: LayoutName;
}

export function NeuralSpace() {
  return (
    <ReactFlowProvider>
      <NeuralSpaceInner />
    </ReactFlowProvider>
  );
}

function NeuralSpaceInner() {
  const navigate = useNavigate();
  const { fitView, setCenter, zoomIn, zoomOut, getViewport } = useReactFlow();

  const universes = useApp((s) => s.universes);
  const activeUniverseId = useApp((s) => s.activeUniverseId);
  const allNodes = useApp((s) => s.nodes);
  const allEdges = useApp((s) => s.edges);
  const progress = useApp((s) => s.progress);
  const selectedNodeId = useApp((s) => s.selectedNodeId);
  const selectNode = useApp((s) => s.selectNode);
  const settings = useApp((s) => s.settings);
  const updateSettings = useApp((s) => s.updateSettings);
  const setNodePosition = useApp((s) => s.setNodePosition);
  const toggleCollapse = useApp((s) => s.toggleCollapse);
  const setActiveUniverse = useApp((s) => s.setActiveUniverse);
  const toggleFocusMode = useApp((s) => s.toggleFocusMode);
  const expandBranch = useApp((s) => s.expandBranch);

  const universe = universes.find((u) => u.id === activeUniverseId) ?? universes[0];
  const universeNodes = useMemo(() => allNodes.filter((n) => n.universeId === universe?.id), [allNodes, universe?.id]);
  const universeEdges = useMemo(() => allEdges.filter((e) => e.universeId === universe?.id), [allEdges, universe?.id]);

  const [layout, setLayout] = useState<LayoutName>(settings.graphLayout);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<Set<NodeType>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<NodeStatus>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<Set<Difficulty>>(new Set());
  const [hideMastered, setHideMastered] = useState(false);
  const [showWeak, setShowWeak] = useState(false);
  const [showPrereqChains, setShowPrereqChains] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const historyRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const [, forceRender] = useState(0);

  const layoutPositions = useMemo(() => {
    if (!universe) return new Map<string, { x: number; y: number }>();
    return computeLayout(layout, universeNodes, universeEdges, universe.rootNodeId);
  }, [layout, universeNodes, universeEdges, universe]);

  const collapsedSet = useMemo(() => new Set(universeNodes.filter((n) => n.collapsed).map((n) => n.id)), [universeNodes]);

  const hiddenByCollapse = useMemo(() => {
    const hidden = new Set<string>();
    const parentOf = new Map(universeNodes.map((n) => [n.id, n.parentId]));
    for (const n of universeNodes) {
      let cursor = parentOf.get(n.id) ?? null;
      let guard = 0;
      while (cursor && guard++ < 40) {
        if (collapsedSet.has(cursor)) {
          hidden.add(n.id);
          break;
        }
        cursor = parentOf.get(cursor) ?? null;
      }
    }
    return hidden;
  }, [universeNodes, collapsedSet]);

  const childCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of universeNodes) {
      if (n.parentId) map.set(n.parentId, (map.get(n.parentId) ?? 0) + 1);
    }
    return map;
  }, [universeNodes]);

  const statusOf = useCallback(
    (id: string): NodeStatus => {
      const p = progress[id];
      if (!p) return 'unexplored';
      return p.status;
    },
    [progress],
  );

  const passesFilter = useCallback(
    (node: KnowledgeNode) => {
      if (typeFilter.size && !typeFilter.has(node.type)) return false;
      if (difficultyFilter.size && !difficultyFilter.has(node.difficulty)) return false;
      const st = statusOf(node.id);
      if (statusFilter.size && !statusFilter.has(st)) return false;
      if (hideMastered && st === 'mastered') return false;
      if (showWeak) {
        const p = progress[node.id];
        if (!p || !p.firstStudied || forgettingRisk(p) < 55) return false;
      }
      return true;
    },
    [typeFilter, difficultyFilter, statusFilter, hideMastered, showWeak, statusOf, progress],
  );

  const searchMatches = useMemo(() => {
    if (!search.trim()) return new Set<string>();
    const matches = new Set<string>();
    for (const n of universeNodes) {
      if (
        fuzzyMatch(search, n.title) ||
        fuzzyMatch(search, n.summary) ||
        n.definitions.some((d) => fuzzyMatch(search, d.term))
      ) {
        matches.add(n.id);
      }
    }
    return matches;
  }, [search, universeNodes]);

  const neighbours = useMemo(() => {
    const focus = hoveredNode ?? selectedNodeId;
    if (!focus) return new Set<string>();
    const set = new Set<string>([focus]);
    for (const e of universeEdges) {
      if (e.source === focus) set.add(e.target);
      if (e.target === focus) set.add(e.source);
    }
    return set;
  }, [hoveredNode, selectedNodeId, universeEdges]);

  const visibleNodes = useMemo(
    () => universeNodes.filter((n) => !hiddenByCollapse.has(n.id) && passesFilter(n)),
    [universeNodes, hiddenByCollapse, passesFilter],
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const flowNodes = useMemo<Node[]>(() => {
    return visibleNodes.map((n) => {
      const p = progress[n.id];
      const mastery = p ? computeMastery(p) : 0;
      const st = statusOf(n.id);
      const hasSearch = searchMatches.size > 0;
      const isMatch = searchMatches.has(n.id);
      const inNeighbourhood = neighbours.size > 0 ? neighbours.has(n.id) : true;
      return {
        id: n.id,
        type: 'knowledge',
        position: layoutPositions.get(n.id) ?? n.position,
        selected: selectedNodeId === n.id,
        data: {
          node: n,
          progress: p,
          mastery,
          status: st,
          dimmed: (hasSearch && !isMatch) || (neighbours.size > 0 && !inNeighbourhood),
          highlighted: isMatch || (neighbours.has(n.id) && n.id !== (hoveredNode ?? selectedNodeId)),
          hasChildren: (childCounts.get(n.id) ?? 0) > 0,
          collapsed: Boolean(n.collapsed),
          childCount: childCounts.get(n.id) ?? 0,
        } satisfies GraphNodeData,
      };
    });
  }, [visibleNodes, progress, statusOf, searchMatches, neighbours, selectedNodeId, layoutPositions, childCounts, hoveredNode]);

  const flowEdges = useMemo<Edge[]>(() => {
    const list: Edge[] = [];
    const focus = hoveredNode ?? selectedNodeId;
    for (const e of universeEdges) {
      if (!visibleIds.has(e.source) || !visibleIds.has(e.target)) continue;
      const isContains = e.type === 'contains';
      if (!showPrereqChains && !isContains && e.type === 'prerequisite') {
        // prerequisites still shown but thin
      }
      const hot = focus ? e.source === focus || e.target === focus : false;
      list.push({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: settings.animateEdges && hot,
        type: 'smoothstep',
        className: cn(focus ? (hot ? 'edge-hot' : 'edge-dim') : ''),
        style: {
          stroke: EDGE_COLORS[e.type] ?? 'var(--line)',
          strokeWidth: hot ? 2.2 : isContains ? 1.1 : e.type === 'prerequisite' ? 1.6 : 1,
          strokeDasharray: e.type === 'prerequisite' ? '5 4' : e.type === 'contrast' ? '2 3' : undefined,
          opacity: focus ? (hot ? 1 : 0.12) : isContains ? 0.6 : 0.42,
        },
        data: { type: e.type },
      });
    }
    return list;
  }, [universeEdges, visibleIds, hoveredNode, selectedNodeId, settings.animateEdges, showPrereqChains]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const pushHistory = useCallback(
    (entry: HistoryEntry) => {
      historyRef.current = [...historyRef.current.slice(-30), entry];
      futureRef.current = [];
      forceRender((v) => v + 1);
    },
    [],
  );

  const handleSelect = useCallback(
    (id: string | null) => {
      pushHistory({ selected: selectedNodeId, layout });
      selectNode(id);
    },
    [pushHistory, selectedNodeId, layout, selectNode],
  );

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    futureRef.current.push({ selected: selectedNodeId, layout });
    setLayout(prev.layout);
    selectNode(prev.selected);
    updateSettings({ graphLayout: prev.layout });
    forceRender((v) => v + 1);
  };

  const redo = () => {
    const next = futureRef.current.pop();
    if (!next) return;
    historyRef.current.push({ selected: selectedNodeId, layout });
    setLayout(next.layout);
    selectNode(next.selected);
    updateSettings({ graphLayout: next.layout });
    forceRender((v) => v + 1);
  };

  const changeLayout = (name: LayoutName) => {
    pushHistory({ selected: selectedNodeId, layout });
    setLayout(name);
    updateSettings({ graphLayout: name });
    setTimeout(() => fitView({ padding: 0.18, duration: 500 }), 40);
  };

  const centerOn = useCallback(
    (id: string) => {
      const pos = layoutPositions.get(id) ?? universeNodes.find((n) => n.id === id)?.position;
      if (!pos) return;
      setCenter(pos.x + 108, pos.y + 36, { zoom: Math.max(0.75, getViewport().zoom), duration: 500 });
    },
    [layoutPositions, universeNodes, setCenter, getViewport],
  );

  const selectedNode = universeNodes.find((n) => n.id === selectedNodeId) ?? null;

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [universe?.id, layout]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'f') {
        fitView({ padding: 0.2, duration: 400 });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, layout]);

  if (!universe) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted">No universe selected.</p>
        <button className="btn btn-primary" onClick={() => navigate('/app/universes')}>
          Choose a universe
        </button>
      </div>
    );
  }

  const toggleSet = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          handleSelect(node.id);
          centerOn(node.id);
        }}
        onNodeDoubleClick={(_, node) => {
          const n = universeNodes.find((x) => x.id === node.id);
          if (n && (childCounts.get(n.id) ?? 0) > 0) {
            toggleCollapse(n.id);
          }
        }}
        onNodeMouseEnter={(_, node) => setHoveredNode(node.id)}
        onNodeMouseLeave={() => setHoveredNode(null)}
        onNodeDragStop={(_, node) => setNodePosition(node.id, node.position)}
        onPaneClick={() => handleSelect(null)}
        fitView
        minZoom={0.12}
        maxZoom={2.2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        defaultEdgeOptions={{ type: 'smoothstep' }}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(139,151,173,0.16)" />
        <Controls showInteractive={false} position="bottom-left" className="!bottom-20 !left-3 md:!bottom-4" />
        {settings.showMiniMap && (
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            className="!hidden md:!block"
            nodeColor={(n) => {
              const d = n.data as GraphNodeData;
              return TYPE_META[d.node.type]?.color ?? '#5A6782';
            }}
            maskColor="rgba(7,11,20,0.78)"
          />
        )}

        <FlowPanel position="top-left" className="!m-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel)]/92 p-1.5 backdrop-blur">
            <div className="flex items-center gap-1 rounded-lg bg-[var(--panel2)]/70 px-2 py-1">
              <Search size={12} className="text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find concept"
                className="w-28 bg-transparent text-[11px] outline-none placeholder:text-muted sm:w-36"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-muted hover:text-ink" aria-label="Clear search">
                  <X size={11} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-0.5 rounded-lg bg-[var(--panel2)]/70 p-0.5">
              {(['hierarchy', 'radial', 'organic'] as LayoutName[]).map((name) => (
                <Tooltip key={name} label={`${name} layout`}>
                  <button
                    onClick={() => changeLayout(name)}
                    className={cn('rounded px-1.5 py-1 text-[10px] capitalize transition-colors', layout === name ? 'text-ink' : 'text-muted hover:text-ink')}
                    style={layout === name ? { background: 'color-mix(in srgb, var(--accent) 18%, transparent)' } : undefined}
                  >
                    {name === 'hierarchy' ? <GitBranch size={12} /> : name === 'radial' ? <Crosshair size={12} /> : <LayoutGrid size={12} />}
                  </button>
                </Tooltip>
              ))}
            </div>

            <div className="flex items-center gap-0.5">
              <Tooltip label="Zoom in">
                <button onClick={() => zoomIn({ duration: 200 })} className="btn btn-ghost h-6 w-6 !px-0"><ZoomIn size={12} /></button>
              </Tooltip>
              <Tooltip label="Zoom out">
                <button onClick={() => zoomOut({ duration: 200 })} className="btn btn-ghost h-6 w-6 !px-0"><ZoomOut size={12} /></button>
              </Tooltip>
              <Tooltip label="Fit view (F)">
                <button onClick={() => fitView({ padding: 0.2, duration: 400 })} className="btn btn-ghost h-6 w-6 !px-0"><Maximize2 size={12} /></button>
              </Tooltip>
              <Tooltip label="Center selected">
                <button
                  onClick={() => selectedNodeId && centerOn(selectedNodeId)}
                  disabled={!selectedNodeId}
                  className="btn btn-ghost h-6 w-6 !px-0"
                >
                  <Crosshair size={12} />
                </button>
              </Tooltip>
            </div>

            <div className="flex items-center gap-0.5">
              <Tooltip label="Undo (Ctrl+Z)">
                <button onClick={undo} disabled={!historyRef.current.length} className="btn btn-ghost h-6 w-6 !px-0"><Undo2 size={12} /></button>
              </Tooltip>
              <Tooltip label="Redo (Ctrl+Y)">
                <button onClick={redo} disabled={!futureRef.current.length} className="btn btn-ghost h-6 w-6 !px-0"><Redo2 size={12} /></button>
              </Tooltip>
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn('btn h-6 gap-1 !px-2 text-[10px]', showFilters ? 'btn-primary' : 'btn-ghost')}
            >
              <ListFilter size={11} /> Filters
              {(typeFilter.size + statusFilter.size + difficultyFilter.size) > 0 && (
                <span className="rounded px-1 text-[9px]" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  {typeFilter.size + statusFilter.size + difficultyFilter.size}
                </span>
              )}
            </button>

            <Tooltip label="Focus mode">
              <button onClick={() => toggleFocusMode(true)} className="btn btn-ghost h-6 w-6 !px-0"><Focus size={12} /></button>
            </Tooltip>
          </div>
        </FlowPanel>

        <FlowPanel position="top-right" className="!m-3 !hidden lg:!block">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)]/92 px-3 py-2 backdrop-blur">
            <p className="text-[9px] uppercase tracking-[0.16em] text-muted">Universe</p>
            <select
              value={universe.id}
              onChange={(e) => setActiveUniverse(e.target.value)}
              className="mt-1 w-40 rounded border border-[var(--line)] bg-[var(--panel2)] px-1.5 py-1 text-[11px] outline-none"
            >
              {universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <div className="mt-2 space-y-1 text-[9px] text-muted">
              <div className="flex justify-between"><span>Visible</span><span className="font-mono">{visibleNodes.length}/{universeNodes.length}</span></div>
              <div className="flex justify-between"><span>Edges</span><span className="font-mono">{flowEdges.length}</span></div>
            </div>
            <div className="mt-2 space-y-1.5 border-t border-[var(--line)] pt-2">
              <EdgeLegend />
            </div>
          </div>
        </FlowPanel>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute left-3 top-[62px] z-10 w-[min(92vw,320px)] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]/97 shadow-panel backdrop-blur"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
                <span className="text-[11px] font-semibold">Filters</span>
                <button onClick={() => setShowFilters(false)} className="text-muted hover:text-ink" aria-label="Close filters"><X size={12} /></button>
              </div>
              <div className="max-h-[52vh] space-y-3 overflow-y-auto p-3">
                <div>
                  <p className="label mb-1.5">Node type</p>
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(TYPE_META) as NodeType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleSet(typeFilter, t, setTypeFilter)}
                        className="chip transition-colors"
                        style={
                          typeFilter.has(t)
                            ? { borderColor: TYPE_META[t].color, color: TYPE_META[t].color, background: `color-mix(in srgb, ${TYPE_META[t].color} 14%, transparent)` }
                            : undefined
                        }
                      >
                        {TYPE_META[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label mb-1.5">Mastery state</p>
                  <div className="flex flex-wrap gap-1">
                    {(Object.keys(STATUS_META) as NodeStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => toggleSet(statusFilter, st, setStatusFilter)}
                        className="chip transition-colors"
                        style={statusFilter.has(st) ? { borderColor: STATUS_META[st].color, color: STATUS_META[st].color } : undefined}
                      >
                        {STATUS_META[st].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label mb-1.5">Difficulty</p>
                  <div className="flex flex-wrap gap-1">
                    {(['beginner', 'intermediate', 'advanced', 'expert'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleSet(difficultyFilter, d, setDifficultyFilter)}
                        className="chip capitalize transition-colors"
                        style={difficultyFilter.has(d) ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 border-t border-[var(--line)] pt-2">
                  {[
                    ['Hide mastered', hideMastered, () => setHideMastered((v) => !v), EyeOff],
                    ['Highlight weak only', showWeak, () => setShowWeak((v) => !v), Eye],
                    ['Show prerequisite chains', showPrereqChains, () => setShowPrereqChains((v) => !v), GitBranch],
                  ].map(([label, active, toggle, Icon]) => (
                    <button
                      key={String(label)}
                      onClick={toggle as () => void}
                      className="flex w-full items-center justify-between rounded px-1.5 py-1 text-[11px] hover:bg-[var(--panel2)]/60"
                    >
                      <span className="flex items-center gap-1.5 text-muted">
                        {/* @ts-expect-error dynamic icon */}
                        <Icon size={11} />
                        {String(label)}
                      </span>
                      <span
                        className="h-3.5 w-6 rounded-full p-0.5 transition-colors"
                        style={{ background: active ? 'var(--accent)' : 'var(--line)' }}
                      >
                        <span
                          className="block h-2.5 w-2.5 rounded-full transition-transform"
                          style={{ background: 'var(--panel)', transform: active ? 'translateX(10px)' : 'none' }}
                        />
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 border-t border-[var(--line)] pt-2">
                  <button
                    className="btn btn-ghost h-6 flex-1 text-[10px]"
                    onClick={() => {
                      setTypeFilter(new Set());
                      setStatusFilter(new Set());
                      setDifficultyFilter(new Set());
                      setHideMastered(false);
                      setShowWeak(false);
                      setShowPrereqChains(false);
                    }}
                  >
                    Reset all
                  </button>
                  <button className="btn btn-ghost h-6 flex-1 text-[10px]" onClick={() => universeNodes.forEach((n) => n.collapsed && expandBranch(n.id))}>
                    Expand all
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ReactFlow>

      <AnimatePresence>
        {selectedNode && (
          <motion.aside
            key={selectedNode.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-16 right-3 top-[62px] z-20 flex w-[min(92vw,330px)] flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]/96 shadow-panel backdrop-blur md:bottom-3"
          >
            <NodePreview node={selectedNode} onClose={() => handleSelect(null)} onOpen={() => navigate(`/app/node/${selectedNode.id}`)} onCenter={() => centerOn(selectedNode.id)} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function NodePreview({
  node,
  onClose,
  onOpen,
  onCenter,
}: {
  node: KnowledgeNode;
  onClose: () => void;
  onOpen: () => void;
  onCenter: () => void;
}) {
  const progress = useApp((s) => s.progress[node.id]);
  const nodes = useApp((s) => s.nodes);
  const edges = useApp((s) => s.edges);
  const selectNode = useApp((s) => s.selectNode);
  const toggleCollapse = useApp((s) => s.toggleCollapse);
  const mastery = progress ? computeMastery(progress) : 0;
  const meta = TYPE_META[node.type];
  const statusMeta = STATUS_META[progress?.status ?? 'unexplored'];

  const prereqs = node.prerequisites.map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as KnowledgeNode[];
  const related = node.related.map((id) => nodes.find((n) => n.id === id)).filter(Boolean) as KnowledgeNode[];
  const incoming = edges.filter((e) => e.target === node.id && e.type !== 'contains');
  const outgoing = edges.filter((e) => e.source === node.id && e.type !== 'contains');
  const childCount = nodes.filter((n) => n.parentId === node.id).length;

  return (
    <>
      <div className="flex items-start justify-between gap-2 border-b border-[var(--line)] px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded" style={{ background: `color-mix(in srgb, ${meta.color} 18%, transparent)`, color: meta.color }}>
              <meta.icon size={9} />
            </span>
            <span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: meta.color }}>{meta.label}</span>
          </div>
          <h3 className="mt-1 text-sm font-semibold leading-tight">{node.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip label="Center node">
            <button onClick={onCenter} className="btn btn-ghost h-6 w-6 !px-0"><Crosshair size={11} /></button>
          </Tooltip>
          <button onClick={onClose} className="btn btn-ghost h-6 w-6 !px-0" aria-label="Close preview"><X size={11} /></button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <p className="text-[11px] leading-relaxed text-muted">{node.summary}</p>

        <div className="flex flex-wrap gap-1">
          <Badge tone="neutral">{node.difficulty}</Badge>
          <Badge tone={progress?.status === 'mastered' ? 'mastery' : progress?.status === 'needs-revision' ? 'warn' : 'accent'}>
            {statusMeta.label}
          </Badge>
          <Badge tone="neutral">{node.estimatedMinutes}m</Badge>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[10px] text-muted">
            <span>Mastery</span>
            <span className="font-mono" style={{ color: statusMeta.color }}>{mastery}%</span>
          </div>
          <ProgressBar value={mastery} height={4} tone={mastery >= 85 ? 'mastery' : mastery >= 55 ? 'accent' : 'warn'} />
        </div>

        {node.objectives.length > 0 && (
          <div>
            <p className="label mb-1">Objectives</p>
            <ul className="space-y-1">
              {node.objectives.slice(0, 3).map((o, i) => (
                <li key={i} className="flex gap-1.5 text-[10px] leading-snug text-muted">
                  <ChevronRight size={9} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}

        {prereqs.length > 0 && (
          <div>
            <p className="label mb-1">Prerequisites</p>
            <div className="space-y-0.5">
              {prereqs.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectNode(p.id)}
                  className="flex w-full items-center justify-between gap-1 rounded px-1.5 py-1 text-left text-[10px] transition-colors hover:bg-[var(--panel2)]/70"
                >
                  <span className="truncate">{p.title}</span>
                  <ChevronRight size={9} className="shrink-0 text-muted" />
                </button>
              ))}
            </div>
          </div>
        )}

        {(related.length > 0 || incoming.length + outgoing.length > 0) && (
          <div>
            <p className="label mb-1">Connections</p>
            <p className="text-[10px] text-muted">
              {incoming.length} incoming · {outgoing.length} outgoing · {related.length} related
            </p>
          </div>
        )}

        {childCount > 0 && (
          <button onClick={() => toggleCollapse(node.id)} className="btn btn-ghost h-7 w-full text-[10px]">
            {node.collapsed ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            {node.collapsed ? `Expand ${childCount} children` : 'Collapse branch'}
          </button>
        )}
      </div>

      <div className="border-t border-[var(--line)] p-2.5">
        <button onClick={onOpen} className="btn btn-primary h-8 w-full text-[11px]">
          <Sparkles size={12} /> Open learning workspace
        </button>
      </div>
    </>
  );
}

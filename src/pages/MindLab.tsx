import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, FlaskConical, Play, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react';
import { useApp } from '@/store/app';
import { Badge, SectionTitle, Tabs } from '@/components/ui';
import { cn } from '@/lib/utils';

type Experiment = 'gradient' | 'tree' | 'sort' | 'bfs' | 'probability';

interface Step {
  label: string;
  detail: string;
}

function GradientLab() {
  const [lr, setLr] = useState(0.1);
  const [start, setStart] = useState(4);
  const [steps, setSteps] = useState<{ x: number; y: number }[]>([]);
  const [running, setRunning] = useState(false);

  const f = (x: number) => x * x - 4 * x + 5;

  const run = () => {
    const out: { x: number; y: number }[] = [];
    let x = start;
    for (let i = 0; i < 24; i++) {
      out.push({ x, y: f(x) });
      const grad = 2 * x - 4;
      x = x - lr * grad;
    }
    setSteps(out);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lr, start]);

  const points = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    for (let x = -1; x <= 6; x += 0.2) list.push({ x, y: f(x) });
    return list;
  }, []);

  const maxY = Math.max(...points.map((p) => p.y));
  const minY = Math.min(...points.map((p) => p.y));
  const px = (x: number) => ((x + 1) / 7) * 300 + 10;
  const py = (y: number) => 150 - ((y - minY) / (maxY - minY)) * 130;

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted">
        Minimise <span className="font-mono text-ink">f(x) = x² − 4x + 5</span> with gradient descent. The true minimum is at
        x = 2. Adjust the learning rate and watch the trajectory: too small and it crawls, too large and it diverges.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-[11px] text-muted">
          Learning rate: <span className="font-mono text-ink">{lr.toFixed(2)}</span>
          <input type="range" min={0.01} max={1.2} step={0.01} value={lr} onChange={(e) => setLr(Number(e.target.value))} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label className="text-[11px] text-muted">
          Start x: <span className="font-mono text-ink">{start.toFixed(1)}</span>
          <input type="range" min={-1} max={6} step={0.1} value={start} onChange={(e) => setStart(Number(e.target.value))} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-2">
        <svg viewBox="0 0 320 160" className="h-40 w-full">
          <polyline fill="none" stroke="var(--line)" strokeWidth={1.5} points={points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')} />
          {steps.map((s, i) => (
            <circle key={i} cx={px(s.x)} cy={py(s.y)} r={i === 0 ? 3.4 : 2} fill={i === 0 ? 'var(--ai)' : 'var(--accent)'} opacity={0.35 + (i / steps.length) * 0.65} />
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setRunning((v) => !v)} className="btn btn-ghost h-7 text-[10px]">
          <Play size={10} /> {running ? 'Pause' : 'Animate'}
        </button>
        <span className="text-[10px] text-muted">
          {steps.length > 0 && (
            <>
              final x ≈ <span className="font-mono text-ink">{steps[steps.length - 1].x.toFixed(3)}</span> · f(x) ≈{' '}
              <span className="font-mono text-ink">{steps[steps.length - 1].y.toFixed(3)}</span>
            </>
          )}
        </span>
      </div>
      {lr > 1 && <p className="text-[10px]" style={{ color: '#FF8A9B' }}>Learning rate above 1.0 diverges for this quadratic.</p>}
    </div>
  );
}

function TreeLab() {
  const data = useMemo(
    () => [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 5, y: 0 },
      { x: 6, y: 1 },
      { x: 7, y: 1 },
      { x: 8, y: 0 },
    ],
    [],
  );
  const [threshold, setThreshold] = useState(4.5);

  const gini = (items: typeof data) => {
    if (!items.length) return 0;
    const ones = items.filter((d) => d.y === 1).length;
    const p = ones / items.length;
    return 1 - p * p - (1 - p) * (1 - p);
  };

  const left = data.filter((d) => d.x <= threshold);
  const right = data.filter((d) => d.x > threshold);
  const weighted = (gini(left) * left.length + gini(right) * right.length) / data.length;

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted">
        A decision tree picks splits that reduce impurity. Move the threshold to see the weighted Gini impurity of the two
        children. The optimal split separates the two classes cleanly.
      </p>

      <label className="block text-[11px] text-muted">
        Split threshold: <span className="font-mono text-ink">x ≤ {threshold.toFixed(1)}</span>
        <input type="range" min={1} max={8} step={0.5} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="mt-1 w-full accent-[var(--accent)]" />
      </label>

      <div className="flex items-end gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-3">
        {data.map((d) => (
          <div key={d.x} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t"
              style={{ height: `${28 + d.x * 5}px`, background: d.y ? 'var(--ai)' : 'var(--accent)', opacity: d.x <= threshold ? 1 : 0.4 }}
            />
            <span className="font-mono text-[8.5px] text-muted">{d.x}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ['Left node', `${left.length} samples · Gini ${gini(left).toFixed(2)}`],
          ['Right node', `${right.length} samples · Gini ${gini(right).toFixed(2)}`],
          ['Weighted impurity', weighted.toFixed(3)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[var(--line)] bg-[var(--panel2)]/40 p-2">
            <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
            <p className="mt-0.5 font-mono text-[11px]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SortLab() {
  const [input, setInput] = useState('5,2,9,1,7,3');
  const [steps, setSteps] = useState<number[][]>([]);
  const [index, setIndex] = useState(0);

  const run = () => {
    const arr = input
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n))
      .slice(0, 12);
    const frames: number[][] = [[...arr]];
    const a = [...arr];
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a.length - i - 1; j++) {
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          frames.push([...a]);
        }
      }
    }
    setSteps(frames);
    setIndex(0);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = steps[index] ?? [];
  const max = Math.max(1, ...current);

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted">
        Bubble sort compares adjacent pairs and swaps them when out of order. Each frame is a completed swap — step through
        to see the array become ordered.
      </p>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="input flex-1 text-[11.5px]" placeholder="5,2,9,1" />
        <button onClick={run} className="btn btn-ghost h-8 text-[11px]">
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <div className="flex items-end justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-3">
        {current.map((v, i) => (
          <motion.div
            key={i}
            layout
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className="w-full rounded-t"
              style={{ height: `${20 + (v / max) * 70}px`, background: 'linear-gradient(180deg, var(--accent), var(--ai))' }}
            />
            <span className="font-mono text-[9px] text-muted">{v}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} className="btn btn-ghost h-7 text-[10px]">
          Back
        </button>
        <button disabled={index >= steps.length - 1} onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} className="btn btn-ghost h-7 text-[10px]">
          Step
        </button>
        <span className="font-mono text-[10px] text-muted">
          frame {steps.length ? index + 1 : 0}/{steps.length}
        </span>
      </div>
    </div>
  );
}

function BfsLab() {
  const graph: Record<string, string[]> = {
    A: ['B', 'C'],
    B: ['D', 'E'],
    C: ['F'],
    D: [],
    E: ['F'],
    F: ['G'],
    G: [],
  };
  const [order, setOrder] = useState<string[]>([]);

  const run = () => {
    const visited = new Set<string>(['A']);
    const queue: string[] = ['A'];
    const out: string[] = [];
    while (queue.length) {
      const node = queue.shift()!;
      out.push(node);
      for (const nb of graph[node] ?? []) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    setOrder(out);
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted">
        Breadth-first search explores level by level using a FIFO queue. It finds the shortest path in an unweighted graph —
        which is why it is the backbone of many graph algorithms.
      </p>
      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-3">
        <svg viewBox="0 0 320 140" className="h-36 w-full">
          {Object.entries(graph).flatMap(([from, list]) =>
            list.map((to) => {
              const idx = (id: string) => Object.keys(graph).indexOf(id);
              const x1 = 30 + idx(from) * 42;
              const x2 = 30 + idx(to) * 42;
              return <line key={`${from}-${to}`} x1={x1} y1={70} x2={x2} y2={70} stroke="var(--line)" strokeWidth={1.4} />;
            }),
          )}
          {Object.keys(graph).map((id, i) => {
            const seen = order.includes(id);
            return (
              <g key={id}>
                <circle cx={30 + i * 42} cy={70} r={13} fill={seen ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'var(--panel)'} stroke={seen ? 'var(--accent)' : 'var(--line)'} strokeWidth={1.4} />
                <text x={30 + i * 42} y={74} textAnchor="middle" fontSize={9} fill={seen ? 'var(--accent)' : 'var(--muted)'} fontFamily="JetBrains Mono, monospace">
                  {id}
                </text>
                {seen && (
                  <text x={30 + i * 42} y={98} textAnchor="middle" fontSize={7.5} fill="var(--muted)" fontFamily="JetBrains Mono, monospace">
                    {order.indexOf(id) + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-[10.5px] text-muted">
        Visit order: <span className="font-mono text-ink">{order.join(' → ')}</span>
      </p>
    </div>
  );
}

function ProbabilityLab() {
  const [p, setP] = useState(0.5);
  const [trials, setTrials] = useState(10);
  const [results, setResults] = useState<{ heads: number; tails: number } | null>(null);

  const simulate = () => {
    let heads = 0;
    for (let i = 0; i < trials; i++) if (Math.random() < p) heads += 1;
    setResults({ heads, tails: trials - heads });
  };

  useEffect(() => {
    simulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, trials]);

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted">
        Simulate a biased coin. As the number of trials grows, the observed frequency converges to the true probability —
        this is the law of large numbers.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-[11px] text-muted">
          P(heads) = <span className="font-mono text-ink">{p.toFixed(2)}</span>
          <input type="range" min={0} max={1} step={0.01} value={p} onChange={(e) => setP(Number(e.target.value))} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
        <label className="text-[11px] text-muted">
          Trials: <span className="font-mono text-ink">{trials}</span>
          <input type="range" min={10} max={5000} step={10} value={trials} onChange={(e) => setTrials(Number(e.target.value))} className="mt-1 w-full accent-[var(--accent)]" />
        </label>
      </div>
      {results && (
        <div className="space-y-2">
          {[
            ['Heads', results.heads, 'var(--accent)'],
            ['Tails', results.tails, 'var(--ai)'],
          ].map(([label, value, color]) => (
            <div key={String(label)}>
              <div className="mb-0.5 flex justify-between text-[10.5px] text-muted">
                <span>{String(label)}</span>
                <span className="font-mono">
                  {String(value)} ({((Number(value) / trials) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                <div className="h-full rounded-full" style={{ width: `${(Number(value) / trials) * 100}%`, background: String(color) }} />
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted">
            Error vs true p: <span className="font-mono text-ink">{Math.abs(results.heads / trials - p).toFixed(4)}</span>
          </p>
        </div>
      )}
      <button onClick={simulate} className="btn btn-ghost h-7 text-[10px]">
        <Play size={10} /> Run again
      </button>
    </div>
  );
}

const EXPERIMENTS: Record<Experiment, { title: string; body: string; render: () => JSX.Element }> = {
  gradient: { title: 'Gradient descent', body: 'Watch a quadratic loss surface get minimised step by step.', render: () => <GradientLab /> },
  tree: { title: 'Decision tree split', body: 'Choose a split threshold and read the Gini impurity.', render: () => <TreeLab /> },
  sort: { title: 'Bubble sort', body: 'Step through the swap sequence frame by frame.', render: () => <SortLab /> },
  bfs: { title: 'Breadth-first search', body: 'Traverse a graph level by level with a FIFO queue.', render: () => <BfsLab /> },
  probability: { title: 'Coin simulation', body: 'Observe the law of large numbers in real time.', render: () => <ProbabilityLab /> },
};

export function MindLab() {
  const [active, setActive] = useState<Experiment>('gradient');
  const toast = useApp((s) => s.toast);
  const checkAchievement = useApp((s) => s.checkAchievement);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      checkAchievement('a_lab', true);
    }
  }, [checkAchievement]);

  const current = EXPERIMENTS[active];

  return (
    <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Mind lab</p>
        <h1 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">Run the algorithm yourself</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          Real simulations with real maths — not animations. Change a parameter and the outcome changes for the reason the
          theory says it should.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="panel h-fit p-2">
          {(Object.keys(EXPERIMENTS) as Experiment[]).map((key) => {
            const exp = EXPERIMENTS[key];
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={cn(
                  'mb-0.5 flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                  isActive ? 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-ink' : 'text-muted hover:bg-[var(--panel2)]/60 hover:text-ink',
                )}
              >
                <span className="flex items-center gap-1.5 text-[11.5px] font-medium">
                  <FlaskConical size={11} className={isActive ? 'text-[var(--accent)]' : ''} />
                  {exp.title}
                </span>
                <span className="text-[10px] leading-snug">{exp.body}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-4">
            <SectionTitle
              title={current.title}
              hint={current.body}
              right={<Badge tone="ai"><Sparkles size={9} /> live</Badge>}
            />
            {current.render()}
          </motion.div>

          <div className="panel p-4">
            <SectionTitle title="What to notice" />
            <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted">
              <li className="flex gap-1.5">
                <Activity size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                Change one parameter at a time. If two things change together you cannot attribute the effect.
              </li>
              <li className="flex gap-1.5">
                <TriangleAlert size={10} className="mt-0.5 shrink-0" style={{ color: '#FFB86B' }} />
                A simulation that looks right can still be wrong. Check the endpoint against the analytic answer.
              </li>
              <li className="flex gap-1.5">
                <Sparkles size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--ai)' }} />
                Connect the experiment back to the concept page — that is where mastery is recorded.
              </li>
            </ul>
            <button
              onClick={() => toast({ title: 'Lab note', description: 'Experiments are exploratory; mastery comes from graded questions.', tone: 'info' })}
              className="btn btn-ghost mt-3 h-7 text-[10px]"
            >
              Log a lab note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  Compass,
  Dna,
  FlaskConical,
  Layers,
  Network,
  Route,
  Sparkles,
  Target,
  Upload,
  Waypoints,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function HeroGraph() {
  const reduce = useReducedMotion();
  const nodes = useMemo(() => {
    const out: { x: number; y: number; r: number; ring: number; delay: number; label?: string }[] = [];
    out.push({ x: 0, y: 0, r: 15, ring: 0, delay: 0, label: 'ML' });
    const ring1 = ['Foundations', 'Methods', 'Evaluation', 'Data'];
    ring1.forEach((label, i) => {
      const a = (i / ring1.length) * Math.PI * 2 - Math.PI / 2;
      out.push({ x: Math.cos(a) * 118, y: Math.sin(a) * 118, r: 9, ring: 1, delay: 0.1 * i, label });
    });
    const labels2 = ['Linear Algebra', 'Probability', 'Calculus', 'Statistics', 'Regression', 'Classification', 'Clustering', 'Deep Learning', 'Regularization', 'Cross Val', 'PCA', 'Trees'];
    labels2.forEach((label, i) => {
      const a = (i / labels2.length) * Math.PI * 2 - Math.PI / 2 + 0.16;
      const rad = 118 + 96 + (i % 3) * 26;
      out.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.86, r: 4.6, ring: 2, delay: 0.06 * i, label });
    });
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + i * 0.37;
      const rad = 340 + (i % 5) * 26;
      out.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.82, r: 2.4, ring: 3, delay: 0.02 * i });
    }
    return out;
  }, []);

  const edges = useMemo(() => {
    const list: { a: number; b: number; ring: number }[] = [];
    for (let i = 1; i <= 4; i++) list.push({ a: 0, b: i, ring: 1 });
    for (let i = 5; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.ring === 2) {
        const parent = 1 + (i % 4);
        list.push({ a: parent, b: i, ring: 2 });
      } else if (node.ring === 3 && i % 2 === 0) {
        list.push({ a: 5 + (i % 12), b: i, ring: 3 });
      }
    }
    for (let i = 5; i < 17; i += 2) list.push({ a: i, b: i + 1, ring: 2 });
    return list;
  }, [nodes]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <div
        className="absolute inset-0 rounded-full opacity-70 blur-3xl"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(54,214,255,0.18), rgba(145,102,255,0.10) 45%, transparent 70%)' }}
      />
      <svg viewBox="-440 -440 880 880" className="relative h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#36D6FF" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#36D6FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#36D6FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#36D6FF" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#9166FF" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <g>
          {edges.map((e, i) => {
            const a = nodes[e.a];
            const b = nodes[e.b];
            if (!a || !b) return null;
            return (
              <motion.line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="url(#edgeGrad)"
                strokeWidth={e.ring === 1 ? 1.1 : 0.65}
                initial={reduce ? { opacity: 0.4 } : { opacity: 0 }}
                animate={{ opacity: e.ring === 1 ? 0.75 : 0.35 }}
                transition={{ duration: 1.1, delay: 0.2 + i * 0.012, ease: 'easeOut' }}
              />
            );
          })}
        </g>

        <g>
          {nodes.map((n, i) => (
            <motion.g
              key={i}
              initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 + n.delay, ease: [0.22, 1, 0.36, 1] }}
            >
              {n.ring === 0 && <circle cx={n.x} cy={n.y} r={64} fill="url(#nodeGlow)" className={reduce ? '' : 'animate-pulseSoft'} />}
              {n.ring === 1 && <circle cx={n.x} cy={n.y} r={26} fill="url(#nodeGlow)" opacity={0.5} />}
              <circle
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill={n.ring === 0 ? '#0B1526' : n.ring === 1 ? '#101B2E' : '#0D1626'}
                stroke={n.ring === 0 ? '#36D6FF' : n.ring === 1 ? 'rgba(54,214,255,0.65)' : n.ring === 2 ? 'rgba(145,102,255,0.5)' : 'rgba(139,151,173,0.32)'}
                strokeWidth={n.ring <= 1 ? 1.6 : 0.9}
              />
              {n.label && n.ring <= 1 && (
                <text
                  x={n.x}
                  y={n.y + (n.ring === 0 ? 4.5 : 3)}
                  textAnchor="middle"
                  fontSize={n.ring === 0 ? 12 : 5.4}
                  fill={n.ring === 0 ? '#E8EDF7' : '#8B97AD'}
                  fontFamily="Space Grotesk, sans-serif"
                  fontWeight={n.ring === 0 ? 700 : 500}
                >
                  {n.label}
                </text>
              )}
              {n.label && n.ring === 2 && (
                <text x={n.x} y={n.y - 9} textAnchor="middle" fontSize={5} fill="#8B97AD" fontFamily="Inter, sans-serif" opacity={0.85}>
                  {n.label}
                </text>
              )}
            </motion.g>
          ))}
        </g>
      </svg>
    </div>
  );
}

const FEATURES = [
  { icon: Waypoints, title: 'Interactive knowledge graph', body: 'Every concept is a node you can expand, follow, and collapse. Pan, zoom, and explore a living map instead of a static outline.' },
  { icon: Upload, title: 'Import any subject', body: 'Drop a PDF, DOCX, or plain text. The engine extracts structure, detects concepts, and builds a validated graph with source references.' },
  { icon: Network, title: 'Connection engine', body: 'Discover cross-topic links with explanations and confidence scores. Prerequisites, contrasts, and shared principles become visible.' },
  { icon: FlaskConical, title: 'Mind Lab', body: 'Real simulations: gradient descent, decision trees, sorting, BFS, and probability. Every experiment has controls, steps, and a challenge.' },
  { icon: Target, title: 'Exam Arena', body: 'Generate tests from any branch. Multiple formats, timers, negative marking, and results that link back to the exact concept you missed.' },
  { icon: Dna, title: 'Memory Matrix', body: 'Spaced repetition with SM-2 scheduling. Mastery is computed from understanding, recall, practice, and consistency — never from opening a page.' },
  { icon: Route, title: 'Guided learning paths', body: 'Generate a prerequisite-ordered sequence for any goal, then follow, skip, or rearrange steps as your understanding grows.' },
  { icon: Sparkles, title: 'Contextual AI assistant', body: 'The assistant knows your current node, prerequisites, and mastery. Demo mode works offline; bring your own provider when you want.' },
];

const STEPS = [
  { n: '01', title: 'Import or choose a subject', body: 'Start with the Machine Learning Galaxy demo, or bring your own document. Structure is extracted into subjects, topics, and concepts.' },
  { n: '02', title: 'Explore the graph', body: 'Open concepts, follow prerequisite chains, and expand branches. The map adapts to what you already know.' },
  { n: '03', title: 'Learn and practice', body: 'Read structured theory, work through examples, run simulations, and answer graded questions per concept.' },
  { n: '04', title: 'Master and retain', body: 'Revision scheduling surfaces what you are about to forget. Mastery reflects demonstrated recall, not time spent.' },
];

export function Landing() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 420], [1, 0.35]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('nm-theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(900px 520px at 78% -8%, rgba(54,214,255,0.13), transparent 62%), radial-gradient(760px 460px at 12% 8%, rgba(145,102,255,0.11), transparent 60%)',
        }}
      />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)]"
            style={{ background: 'linear-gradient(135deg, rgba(54,214,255,0.2), rgba(145,102,255,0.18))' }}
          >
            <BrainCircuit size={16} className="text-[var(--accent)]" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold tracking-tight">NEURAL MAP</p>
            <p className="text-[10px] text-muted">Living Knowledge Engine</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-xs text-muted md:flex">
          <a href="#how" className="transition-colors hover:text-ink">How it works</a>
          <a href="#features" className="transition-colors hover:text-ink">Features</a>
          <a href="#demo" className="transition-colors hover:text-ink">Demo</a>
        </nav>
        <Link to="/app" className="btn btn-primary text-xs">
          Enter app <ArrowRight size={13} />
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-14">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)]/70 px-3 py-1 text-[11px] text-muted backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--mastery)' }} />
            Local-first · works offline · no API key required
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="font-display text-[clamp(2rem,5.2vw,3.4rem)] font-semibold leading-[1.06] tracking-tight"
          >
            Your knowledge is not a collection of pages.
            <span className="block" style={{ color: 'var(--accent)' }}>
              It's a universe.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.14 }}
            className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base"
          >
            Transform any subject into a living network of concepts. Explore connections, understand deeply,
            and build knowledge that stays.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <Link to="/app/universes" className="btn btn-primary">
              <Compass size={15} /> Create Your Knowledge Universe
            </Link>
            <Link to="/app/neural-space" className="btn btn-ghost">
              <Waypoints size={15} /> Explore Demo Universe
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-8 grid max-w-md grid-cols-3 gap-3"
          >
            {[
              ['62', 'concepts mapped'],
              ['110+', 'graded questions'],
              ['8', 'live simulations'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-[var(--line)] bg-[var(--panel)]/50 px-3 py-2.5">
                <p className="font-display text-lg font-semibold" style={{ color: 'var(--accent)' }}>{value}</p>
                <p className="text-[10px] leading-tight text-muted">{label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={mounted ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <HeroGraph />
        </motion.div>
      </section>

      <section id="how" className="relative z-10 mx-auto max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow="How it works"
          title="From raw information to a navigable universe"
          body="Four steps, no black boxes. Everything you do is stored locally and reflected in the graph."
        />
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="panel relative overflow-hidden p-4"
            >
              <span className="font-mono text-[11px]" style={{ color: 'var(--accent)' }}>{step.n}</span>
              <h4 className="mt-2 text-sm font-semibold">{step.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.body}</p>
              <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-[0.07]" style={{ background: 'var(--accent)' }} />
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-6xl px-5 py-16">
        <SectionHeading
          eyebrow="Product"
          title="Built like an instrument, not a dashboard"
          body="Every panel, control, and animation exists to help you understand something faster."
        />
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="panel group p-4 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))]"
            >
              <div
                className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] transition-colors group-hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))]"
                style={{ background: 'color-mix(in srgb, var(--accent) 9%, transparent)' }}
              >
                <f.icon size={14} className="text-[var(--accent)]" />
              </div>
              <h4 className="text-sm font-semibold leading-snug">{f.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="demo" className="relative z-10 mx-auto max-w-6xl px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="panel relative overflow-hidden p-6 sm:p-9"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: 'radial-gradient(600px 300px at 85% 0%, rgba(145,102,255,0.14), transparent 65%)' }}
          />
          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-muted">
                <Layers size={10} /> Included demo
              </div>
              <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Machine Learning Galaxy</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                62 interconnected concepts spanning linear algebra, probability, regression, classification, ensembles,
                deep learning, and evaluation. Full theory, worked examples, formulas, applications, and graded questions —
                all usable with no AI provider configured.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['Linear Algebra', 'Probability', 'Regression', 'Classification', 'Trees', 'Deep Learning', 'Evaluation', 'Clustering'].map((tag) => (
                  <span key={tag} className="chip">{tag}</span>
                ))}
              </div>
            </div>
            <Link to="/app/neural-space" className="btn btn-primary whitespace-nowrap">
              <Zap size={15} /> Open the demo
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--line)] px-6 py-12 text-center sm:px-10"
          style={{ background: 'linear-gradient(160deg, color-mix(in srgb, var(--accent) 8%, var(--panel)), var(--panel))' }}
        >
          <h3 className="mx-auto max-w-2xl font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            Explore knowledge. Discover connections. Build intelligence.
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
            No account. No API key. Your progress is stored in your browser and stays there.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/app" className="btn btn-primary">
              Create Your Knowledge Universe <ArrowRight size={14} />
            </Link>
            <Link to="/app/neural-space" className="btn btn-ghost">
              Explore Demo Universe
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-[var(--line)] px-5 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-[11px] text-muted sm:flex-row">
          <span>NEURAL MAP — Living Knowledge Engine</span>
          <span className="flex items-center gap-3">
            <Link to="/app/settings" className="hover:text-ink">Settings</Link>
            <Link to="/app/profile" className="hover:text-ink">Profile</Link>
            <span>Local-first</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45 }}
      className="max-w-2xl"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </motion.div>
  );
}

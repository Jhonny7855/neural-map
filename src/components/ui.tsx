import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/app';

export function Panel({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('panel', className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  right,
  className,
}: {
  title: string;
  hint?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  tone = 'accent',
  height = 6,
}: {
  value: number;
  className?: string;
  tone?: 'accent' | 'ai' | 'mastery' | 'warn';
  height?: number;
}) {
  const color = {
    accent: 'var(--accent)',
    ai: 'var(--ai)',
    mastery: 'var(--mastery)',
    warn: '#FFB86B',
  }[tone];
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full', className)}
      style={{ height, background: 'color-mix(in srgb, var(--line) 80%, transparent)' }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%', background: color, borderRadius: 999 }}
      />
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'ai' | 'mastery' | 'warn' | 'danger';
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: 'border-[var(--line)] text-muted',
    accent: 'text-[var(--accent)]',
    ai: 'text-[var(--ai)]',
    mastery: 'text-[var(--mastery)]',
    warn: 'text-[#FFB86B]',
    danger: 'text-[#FF6B81]',
  };
  const bg: Record<string, string> = {
    neutral: 'transparent',
    accent: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    ai: 'color-mix(in srgb, var(--ai) 14%, transparent)',
    mastery: 'color-mix(in srgb, var(--mastery) 14%, transparent)',
    warn: 'rgba(255,184,107,0.12)',
    danger: 'rgba(255,107,129,0.12)',
  };
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium', tones[tone], className)}
      style={{ background: bg[tone], borderColor: tone === 'neutral' ? 'var(--line)' : 'currentColor' }}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--panel2)] text-[var(--accent)]">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className={cn('relative w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-panel', width)}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold">{title}</h3>
                {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
              </div>
              <button className="btn btn-ghost h-7 w-7 !px-0" onClick={onClose} aria-label="Close dialog">
                <X size={14} />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toaster() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  const iconFor = (tone: string) => {
    if (tone === 'success') return <Check size={14} className="text-[var(--mastery)]" />;
    if (tone === 'error') return <AlertTriangle size={14} className="text-[#FF6B81]" />;
    if (tone === 'warn') return <AlertTriangle size={14} className="text-[#FFB86B]" />;
    return <Info size={14} className="text-[var(--accent)]" />;
  };
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(92vw,340px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 24, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--panel)]/95 p-3 shadow-panel backdrop-blur"
          >
            <div className="mt-0.5">{iconFor(t.tone)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold leading-tight">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[11px] leading-snug text-muted">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink" aria-label="Dismiss">
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; icon?: ReactNode; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--line)]', className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded px-1 font-mono text-[10px] text-muted" style={{ background: 'var(--panel2)' }}>
                {tab.count}
              </span>
            )}
            {active && (
              <motion.div
                layoutId="tab-underline"
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded border border-[var(--line)] bg-[var(--panel2)] px-2 py-1 text-[10px] text-ink opacity-0 transition-opacity group-hover/tt:opacity-100">
        {label}
      </span>
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = 'accent',
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: 'accent' | 'ai' | 'mastery' | 'warn';
  icon?: ReactNode;
}) {
  const color = { accent: 'var(--accent)', ai: 'var(--ai)', mastery: 'var(--mastery)', warn: '#FFB86B' }[tone];
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight" style={{ color }}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

/** Measures elapsed time on a node and reports it on unmount / node change. */
export function useTimeTracker(nodeId: string | null) {
  const addTimeSpent = useApp((s) => s.addTimeSpent);
  const startRef = useRef<number | null>(null);
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    if (nodeId) {
      idRef.current = nodeId;
      startRef.current = Date.now();
    }
    return () => {
      if (startRef.current && idRef.current) {
        const elapsed = Date.now() - startRef.current;
        if (elapsed > 1200 && elapsed < 1000 * 60 * 45) addTimeSpent(idRef.current, elapsed);
      }
      startRef.current = null;
    };
  }, [nodeId, addTimeSpent]);
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

const ConfirmContext = createContext<(opts: {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}) => Promise<boolean>>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel: string;
    danger: boolean;
    resolve?: (v: boolean) => void;
  }>({ open: false, title: '', confirmLabel: 'Confirm', danger: false });

  const confirm = useMemo(
    () =>
      (opts: { title: string; description?: string; confirmLabel?: string; danger?: boolean }) =>
        new Promise<boolean>((resolve) => {
          setState({
            open: true,
            title: opts.title,
            description: opts.description,
            confirmLabel: opts.confirmLabel ?? 'Confirm',
            danger: opts.danger ?? false,
            resolve,
          });
        }),
    [],
  );

  const close = (value: boolean) => {
    state.resolve?.(value);
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={state.open}
        onClose={() => close(false)}
        title={state.title}
        description={state.description}
        width="max-w-md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => close(false)}>
              Cancel
            </button>
            <button
              className="btn"
              style={
                state.danger
                  ? { background: 'rgba(255,107,129,0.16)', border: '1px solid rgba(255,107,129,0.5)', color: '#FF8A9B' }
                  : { background: 'var(--accent)', color: '#04121b' }
              }
              onClick={() => close(true)}
            >
              {state.confirmLabel}
            </button>
          </>
        }
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

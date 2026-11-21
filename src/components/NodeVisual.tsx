import type { VisualSpec } from '@/types';

export function NodeVisual({ spec }: { spec: VisualSpec }) {
  const max = Math.max(1, ...(spec.points ?? []).map((p) => p.value));
  return (
    <figure className="rounded-lg border border-[var(--line)] bg-[var(--panel2)]/40 p-3">
      <figcaption className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold">{spec.title}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted">{spec.kind}</span>
      </figcaption>

      {spec.kind === 'bars' && spec.points && (
        <div className="space-y-1.5">
          {spec.points.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-[10px] text-muted">{p.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(3, (p.value / max) * 100)}%`,
                    background: 'linear-gradient(90deg, var(--accent), var(--ai))',
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted">{p.value}</span>
            </div>
          ))}
        </div>
      )}

      {spec.kind === 'curve' && spec.points && (
        <svg viewBox="0 0 320 120" className="h-28 w-full">
          {spec.points.map((p, i) => {
            const x = (i / Math.max(1, spec.points!.length - 1)) * 300 + 10;
            const y = 110 - (p.value / max) * 95;
            return <circle key={i} cx={x} cy={y} r={3} fill="var(--accent)" />;
          })}
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.6}
            points={spec.points
              .map((p, i) => `${(i / Math.max(1, spec.points!.length - 1)) * 300 + 10},${110 - (p.value / max) * 95}`)
              .join(' ')}
          />
        </svg>
      )}

      {(spec.kind === 'flow' || spec.kind === 'stack' || spec.kind === 'list') && spec.steps && (
        <ol className="space-y-1.5">
          {spec.steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-[11px] leading-snug">
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded font-mono text-[9px]"
                style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}
              >
                {i + 1}
              </span>
              <span className="text-muted">{s}</span>
            </li>
          ))}
        </ol>
      )}

      {spec.kind === 'matrix' && spec.matrix && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-[10px]">
            <thead>
              <tr>
                <th />
                {spec.matrix.cols.map((c, i) => (
                  <th key={i} className="px-1.5 py-1 font-medium text-muted">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spec.matrix.rows.map((r, ri) => (
                <tr key={ri}>
                  <th className="px-1.5 py-1 text-left font-medium text-muted">{r}</th>
                  {spec.matrix!.values[ri]?.map((v, ci) => (
                    <td
                      key={ci}
                      className="border border-[var(--line)] px-1.5 py-1 text-center font-mono"
                      style={{ background: `color-mix(in srgb, var(--accent) ${Math.min(60, Math.abs(v) * 8)}%, transparent)` }}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {spec.caption && <p className="mt-2 text-[10px] leading-relaxed text-muted">{spec.caption}</p>}
    </figure>
  );
}

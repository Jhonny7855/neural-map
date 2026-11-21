import { useEffect, useState } from 'react';
import type { Question } from '@/types';
import { cn } from '@/lib/utils';

export type Given = string | number | boolean | string[] | null;

export function QuestionInput({
  question,
  value,
  onChange,
  disabled,
}: {
  question: Question;
  value: Given;
  onChange: (v: Given) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(typeof value === 'string' ? value : '');

  useEffect(() => {
    setText(typeof value === 'string' ? value : '');
  }, [question.id, value]);

  if (question.type === 'mcq' || question.type === 'truefalse') {
    const options =
      question.type === 'truefalse'
        ? [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' },
          ]
        : question.options ?? [];
    const selected =
      question.type === 'truefalse'
        ? value === true
          ? 'true'
          : value === false
            ? 'false'
            : null
        : value === null || value === undefined
          ? null
          : String(value);
    return (
      <div className="space-y-1.5">
        {options.map((o) => {
          const active = selected === o.id;
          return (
            <button
              key={o.id}
              disabled={disabled}
              onClick={() => onChange(question.type === 'truefalse' ? o.id === 'true' : Number(o.id))}
              className={cn(
                'flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-[11.5px] leading-snug transition-colors',
                active
                  ? 'border-[color-mix(in_srgb,var(--accent)_60%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-ink'
                  : 'border-[var(--line)] text-muted hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] hover:text-ink',
              )}
            >
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-mono"
                style={{ borderColor: active ? 'var(--accent)' : 'var(--line)', color: active ? 'var(--accent)' : 'var(--muted)' }}
              >
                {String.fromCharCode(65 + Number(o.id || 0))}
              </span>
              {o.text}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'multi') {
    const arr = Array.isArray(value) ? value.map(String) : [];
    return (
      <div className="space-y-1.5">
        {(question.options ?? []).map((o) => {
          const active = arr.includes(o.id);
          return (
            <button
              key={o.id}
              disabled={disabled}
              onClick={() => onChange(active ? arr.filter((x) => x !== o.id) : [...arr, o.id])}
              className={cn(
                'flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-[11.5px] leading-snug transition-colors',
                active
                  ? 'border-[color-mix(in_srgb,var(--ai)_60%,var(--line))] bg-[color-mix(in_srgb,var(--ai)_12%,transparent)] text-ink'
                  : 'border-[var(--line)] text-muted hover:text-ink',
              )}
            >
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px]"
                style={{ borderColor: active ? 'var(--ai)' : 'var(--line)', color: active ? 'var(--ai)' : 'transparent' }}
              >
                ✓
              </span>
              {o.text}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'match') {
    const pairs = question.pairs ?? [];
    const current = Array.isArray(value) ? (value as unknown as { left: string; right: string }[]) : [];
    const rights = pairs.map((p) => p.right);
    return (
      <div className="space-y-1.5">
        {pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1/2 truncate text-[11px] text-muted">{p.left}</span>
            <select
              disabled={disabled}
              value={current[i]?.right ?? ''}
              onChange={(e) => {
                const next = pairs.map((pair, idx) => ({ left: pair.left, right: idx === i ? e.target.value : current[idx]?.right ?? '' }));
                onChange(next as unknown as Given);
              }}
              className="w-1/2 rounded border border-[var(--line)] bg-[var(--panel2)] px-1.5 py-1 text-[11px] outline-none"
            >
              <option value="">select…</option>
              {rights.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === 'code' || question.type === 'scenario' || question.type === 'short') {
    return (
      <textarea
        disabled={disabled}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={question.starter ? 'Write your answer…' : 'Type your answer…'}
        rows={question.type === 'code' ? 5 : 3}
        spellCheck={false}
        className={cn(
          'w-full rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2.5 py-2 text-[11.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,var(--line))]',
          question.type === 'code' && 'font-mono',
        )}
      />
    );
  }

  return (
    <input
      disabled={disabled}
      type="text"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value);
      }}
      placeholder="Enter a number"
      className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel2)] px-2.5 py-2 font-mono text-[11.5px] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,var(--line))]"
    />
  );
}

export function isAnswered(question: Question, given: Given): boolean {
  if (given === null || given === undefined) return false;
  if (question.type === 'multi') return Array.isArray(given) && given.length > 0;
  if (question.type === 'match') return Array.isArray(given) && given.length > 0 && (given as unknown as { right: string }[]).every((p) => p?.right);
  if (typeof given === 'string') return given.trim().length > 0;
  return true;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = 'id') {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function formatMinutes(minutes: number) {
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function pluralize(count: number, word: string, plural?: string) {
  return `${count} ${count === 1 ? word : plural ?? `${word}s`}`;
}

export const RANKS = [
  { name: 'Explorer', min: 0 },
  { name: 'Curious Mind', min: 150 },
  { name: 'Knowledge Seeker', min: 400 },
  { name: 'Analyst', min: 800 },
  { name: 'Strategist', min: 1400 },
  { name: 'Specialist', min: 2200 },
  { name: 'Architect', min: 3200 },
  { name: 'Master Mind', min: 4600 },
  { name: 'Neural Pioneer', min: 6400 },
  { name: 'Knowledge Architect', min: 8600 },
] as const;

export function rankFor(xp: number) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) index = i;
  const current = RANKS[index];
  const next = RANKS[index + 1];
  const floor = current.min;
  const ceiling = next ? next.min : current.min + 2000;
  const progress = clamp(((xp - floor) / (ceiling - floor)) * 100);
  return {
    index,
    name: current.name,
    level: index + 1,
    next: next?.name ?? null,
    nextAt: ceiling,
    progress,
    remaining: Math.max(0, ceiling - xp),
  };
}

export const XP_REWARDS = {
  discover: 10,
  theory: 20,
  basicQuestion: 10,
  advancedQuestion: 25,
  conceptTest: 50,
  mastery: 100,
  connection: 20,
  quest: 75,
} as const;

export const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

export function difficultyWeight(d: string) {
  return { beginner: 1, intermediate: 1.25, advanced: 1.5, expert: 1.8 }[d] ?? 1.2;
}

export function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function fuzzyMatch(query: string, text: string) {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return true;
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function scoreMatch(query: string, text: string) {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 85;
  if (t.includes(q)) return 70;
  return fuzzyMatch(q, t) ? 35 : 0;
}

export function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function downloadFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Minimal, safe markdown renderer: escapes HTML first, then applies a small whitelist. */
export function renderMarkdown(md: string) {
  let html = escapeHtml(md);
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code.trim()}</code></pre>`);
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|\n)###\s+(.+)/g, '$1<h4>$2</h4>');
  html = html.replace(/(^|\n)##\s+(.+)/g, '$1<h3>$2</h3>');
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = html.replace(/\n[-*]\s+/g, '\n<li>');
  html = html.replace(/(<li>[\s\S]*?)(?=\n(?!<li>)|$)/g, '<ul>$1</ul>');
  return `<p>${html}</p>`;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function groupBy<T, K extends string | number>(arr: T[], key: (item: T) => K) {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(key(item));
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

export function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

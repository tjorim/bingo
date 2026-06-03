export type Period = 'weekly' | 'monthly';

export interface Config {
  period: Period;
}

export interface SavedState {
  card: (number | null)[][];
  marked: number[];
  codes: string[];
  createdAt: string; // ISO string
}

const CONFIG_KEY = 'bingo-config';
const STATE_KEY = 'bingo-state';

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore — localStorage unavailable or quota exceeded
  }
}

export function loadConfig(): Config {
  return safeGet<Config>(CONFIG_KEY) ?? { period: 'weekly' };
}

export function saveConfig(config: Config): void {
  safeSet(CONFIG_KEY, config);
}

export function loadState(): SavedState | null {
  const s = safeGet<SavedState>(STATE_KEY);
  // Basic shape validation
  if (!s || !Array.isArray(s.card) || !Array.isArray(s.marked) || !Array.isArray(s.codes) || !s.createdAt)
    return null;
  return s;
}

export function saveState(state: SavedState): void {
  safeSet(STATE_KEY, state);
}

function getWeekStart(d: Date): number {
  const day = d.getDay(); // 0 = Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

export function isStateValid(createdAt: string, period: Period): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  if (period === 'weekly') return getWeekStart(created) === getWeekStart(now);
  return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
}

export function getCardExpiry(createdAt: string, period: Period): Date {
  const created = new Date(createdAt);
  if (period === 'weekly') {
    // Next Monday after the week that contains createdAt
    const start = new Date(getWeekStart(created));
    return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(created.getFullYear(), created.getMonth() + 1, 1);
}

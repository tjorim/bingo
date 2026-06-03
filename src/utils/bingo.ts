export const COLUMNS = ['O', 'K', 'T', 'A', '!'] as const;
export type Column = (typeof COLUMNS)[number];

// Okta Number Challenge shows 1–99. Split evenly across 5 columns.
const COLUMN_RANGES: Record<Column, [number, number]> = {
  O: [1,  20],
  K: [21, 40],
  T: [41, 60],
  A: [61, 80],
  '!': [81, 99],
};

function pickUnique(min: number, max: number, count: number): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// Returns a 5×5 grid (row-major). null = FREE center cell.
export function generateCard(): (number | null)[][] {
  const columns: (number | null)[][] = COLUMNS.map((col, ci) => {
    const [min, max] = COLUMN_RANGES[col];
    if (ci === 2) {
      const nums = pickUnique(min, max, 4);
      return [nums[0], nums[1], null, nums[2], nums[3]];
    }
    return pickUnique(min, max, 5) as (number | null)[];
  });

  return Array.from({ length: 5 }, (_, row) => columns.map(col => col[row]));
}

// Display a 1–99 number with consistent 2-char width in the grid.
export function fmt(n: number): string {
  return n.toString().padStart(2, '0');
}

export type WinLine = {
  cells: [number, number][];
};

export function checkWin(
  card: (number | null)[][],
  marked: ReadonlySet<number>,
): WinLine | null {
  const hit = (r: number, c: number) => {
    const v = card[r][c];
    return v === null || marked.has(v);
  };

  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every(c => hit(r, c)))
      return { cells: [0, 1, 2, 3, 4].map(c => [r, c] as [number, number]) };
  }
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every(r => hit(r, c)))
      return { cells: [0, 1, 2, 3, 4].map(r => [r, c] as [number, number]) };
  }
  if ([0, 1, 2, 3, 4].every(i => hit(i, i)))
    return { cells: [0, 1, 2, 3, 4].map(i => [i, i] as [number, number]) };
  if ([0, 1, 2, 3, 4].every(i => hit(i, 4 - i)))
    return { cells: [0, 1, 2, 3, 4].map(i => [i, 4 - i] as [number, number]) };

  return null;
}

// ── Near-win detection ────────────────────────────────────
export type NearLine = {
  cells: [number, number][];
  neededCell: [number, number];
  neededValue: number;
};

const ALL_LINES: [number, number][][] = [
  ...[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => [r, c] as [number, number])),
  ...[0, 1, 2, 3, 4].map(c => [0, 1, 2, 3, 4].map(r => [r, c] as [number, number])),
  [0, 1, 2, 3, 4].map(i => [i, i] as [number, number]),
  [0, 1, 2, 3, 4].map(i => [i, 4 - i] as [number, number]),
];

export function checkNearWin(
  card: (number | null)[][],
  marked: ReadonlySet<number>,
): NearLine[] {
  const result: NearLine[] = [];
  for (const line of ALL_LINES) {
    const unhit = line.filter(([r, c]) => {
      const v = card[r][c];
      return v !== null && !marked.has(v);
    });
    if (unhit.length === 1) {
      const [nr, nc] = unhit[0];
      result.push({ cells: line, neededCell: [nr, nc], neededValue: card[nr][nc] as number });
    }
  }
  return result;
}

// ── Card sharing ──────────────────────────────────────────
export function encodeCard(card: (number | null)[][]): string {
  return btoa(card.flat().map(v => v ?? 0).join(','));
}

export function decodeCard(encoded: string): (number | null)[][] | null {
  try {
    const flat = atob(encoded).split(',').map(Number);
    if (flat.length !== 25 || flat.some(isNaN)) return null;
    return Array.from({ length: 5 }, (_, r) =>
      flat.slice(r * 5, r * 5 + 5).map(v => (v === 0 ? null : v)),
    );
  } catch {
    return null;
  }
}

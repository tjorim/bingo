export const COLUMNS = ['O', 'K', 'T', 'A', '!'] as const;
export type Column = (typeof COLUMNS)[number];

// Each column covers a 20-number range within 00–99
const COLUMN_RANGES: Record<Column, [number, number]> = {
  O: [0, 19],
  K: [20, 39],
  T: [40, 59],
  A: [60, 79],
  '!': [80, 99],
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
      // Center column: FREE in row 2
      const nums = pickUnique(min, max, 4);
      return [nums[0], nums[1], null, nums[2], nums[3]];
    }
    return pickUnique(min, max, 5) as (number | null)[];
  });

  // Transpose columns → rows
  return Array.from({ length: 5 }, (_, row) => columns.map(col => col[row]));
}

// Split a 6-digit TOTP into three 2-digit numbers: "482951" → [48, 29, 51]
export function parseTotpPairs(code: string): number[] {
  const clean = code.replace(/\D/g, '');
  if (clean.length !== 6) return [];
  return [
    parseInt(clean.slice(0, 2), 10),
    parseInt(clean.slice(2, 4), 10),
    parseInt(clean.slice(4, 6), 10),
  ];
}

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

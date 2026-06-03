import { useMemo } from 'react';
import { COLUMNS } from '../utils/bingo';
import type { WinLine } from '../utils/bingo';
import BingoCell from './BingoCell';

interface Props {
  card: (number | null)[][];
  marked: ReadonlySet<number>;
  justMarked: ReadonlySet<number>;
  win: WinLine | null;
}

export default function BingoCard({ card, marked, justMarked, win }: Props) {
  const winCells = useMemo(() => {
    if (!win) return new Set<string>();
    return new Set(win.cells.map(([r, c]) => `${r},${c}`));
  }, [win]);

  return (
    <div className="bingo-card-wrapper">
      <div className="bingo-grid">
        {/* Column headers */}
        {COLUMNS.map(col => (
          <div key={col} className="bingo-col-header">
            {col}
          </div>
        ))}

        {/* Cells */}
        {card.map((row, r) =>
          row.map((val, c) => (
            <BingoCell
              key={`${r}-${c}`}
              value={val}
              marked={val === null || marked.has(val)}
              winning={winCells.has(`${r},${c}`)}
              justMarked={val !== null && justMarked.has(val)}
            />
          )),
        )}
      </div>
    </div>
  );
}

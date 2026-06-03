import { useMemo } from 'react';
import { COLUMNS } from '../utils/bingo';
import type { WinLine, NearLine } from '../utils/bingo';
import BingoCell from './BingoCell';

interface Props {
  card: (number | null)[][];
  marked: ReadonlySet<number>;
  justMarked: ReadonlySet<number>;
  win: WinLine | null;
  nearWins: NearLine[];
}

export default function BingoCard({ card, marked, justMarked, win, nearWins }: Props) {
  const winCells = useMemo(() => {
    if (!win) return new Set<string>();
    return new Set(win.cells.map(([r, c]) => `${r},${c}`));
  }, [win]);

  const neededCells = useMemo(() => {
    const s = new Set<string>();
    nearWins.forEach(nw => s.add(`${nw.neededCell[0]},${nw.neededCell[1]}`));
    return s;
  }, [nearWins]);

  // Progress per column (0–1), counting FREE as marked
  const colProgress = COLUMNS.map((_, ci) =>
    card.map(row => row[ci]).filter(v => v === null || marked.has(v as number)).length / 5,
  );

  return (
    <div className="bingo-card-wrapper">
      <div className="bingo-grid">
        {COLUMNS.map((col, ci) => (
          <div key={col} className="bingo-col-header">
            {col}
            <div className="col-heat">
              <div className="col-heat-fill" style={{ width: `${colProgress[ci] * 100}%` }} />
            </div>
          </div>
        ))}

        {card.map((row, r) =>
          row.map((val, c) => (
            <BingoCell
              key={`${r}-${c}`}
              value={val}
              marked={val === null || marked.has(val)}
              winning={winCells.has(`${r},${c}`)}
              justMarked={val !== null && justMarked.has(val)}
              needed={neededCells.has(`${r},${c}`)}
            />
          )),
        )}
      </div>
    </div>
  );
}

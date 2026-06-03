import { fmt } from '../utils/bingo';

interface Props {
  value: number | null;
  marked: boolean;
  winning: boolean;
  justMarked: boolean;
  needed: boolean;
}

export default function BingoCell({ value, marked, winning, justMarked, needed }: Props) {
  const isFree = value === null;

  let cls = 'bingo-cell';
  if (isFree) cls += ' bingo-cell--free';
  else if (winning) cls += ' bingo-cell--winning';
  else if (marked) cls += ' bingo-cell--marked';
  else if (needed) cls += ' bingo-cell--needed';
  if (justMarked && !isFree) cls += ' bingo-cell--just-marked';

  return (
    <div className={cls} title={isFree ? 'Free space!' : undefined}>
      {isFree ? <span className="bingo-free-text">FREE</span> : fmt(value)}
    </div>
  );
}

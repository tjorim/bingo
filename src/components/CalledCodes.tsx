import { parseTotpPairs, fmt } from '../utils/bingo';

interface Props {
  codes: string[];
}

export default function CalledCodes({ codes }: Props) {
  if (codes.length === 0) return null;

  return (
    <div className="called-codes mt-4">
      <p className="text-muted small text-center mb-2">
        <i className="bi bi-clock-history me-1" />
        {codes.length} code{codes.length !== 1 ? 's' : ''} entered
      </p>
      <div className="d-flex flex-wrap gap-2 justify-content-center">
        {codes.map((code, i) => {
          const pairs = parseTotpPairs(code);
          return (
            <span key={i} className="badge bg-secondary font-monospace" title={`Marked: ${pairs.map(fmt).join(', ')}`}>
              {code.slice(0, 3)}&thinsp;{code.slice(3)}
              <span className="text-warning ms-1">→ {pairs.map(fmt).join(' ')}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

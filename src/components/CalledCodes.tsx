import { fmt } from '../utils/bingo';

interface Props {
  numbers: number[];
}

export default function CalledCodes({ numbers }: Props) {
  if (numbers.length === 0) return null;

  return (
    <div className="called-codes mt-4">
      <p className="text-muted small text-center mb-2">
        <i className="bi bi-clock-history me-1" />
        {numbers.length} challenge{numbers.length !== 1 ? 's' : ''} entered
      </p>
      <div className="d-flex flex-wrap gap-2 justify-content-center">
        {numbers.map((n, i) => (
          <span key={i} className="badge bg-secondary font-monospace">
            {fmt(n)}
          </span>
        ))}
      </div>
    </div>
  );
}

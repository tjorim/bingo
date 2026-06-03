import { type Config, type Period, getCardExpiry } from '../utils/persistence';

interface Props {
  config: Config;
  cardCreatedAt: string;
  onChange: (c: Config) => void;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function Settings({ config, cardCreatedAt, onChange }: Props) {
  const created = new Date(cardCreatedAt);
  const expiry = getCardExpiry(cardCreatedAt, config.period);

  return (
    <div className="card card-body mb-4 py-2 px-3">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <i className="bi bi-calendar-week text-muted" />
        <span className="text-muted small">Card resets:</span>
        <div className="btn-group btn-group-sm">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              className={`btn ${config.period === value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => onChange({ ...config, period: value })}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-muted small ms-auto">
          Since {created.toLocaleDateString()} · resets {expiry.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

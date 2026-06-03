import type { Stats } from '../utils/persistence';

interface Props {
  stats: Stats;
}

interface StatCardProps {
  emoji: string;
  value: number | string;
  label: string;
}

function StatCard({ emoji, value, label }: StatCardProps) {
  return (
    <div className="col-6 col-sm-3">
      <div className="card card-body text-center py-2 px-1">
        <div className="stat-emoji">{emoji}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function StatsPanel({ stats }: Props) {
  const avg =
    stats.totalBingos > 0
      ? Math.round(stats.totalCodesInBingos / stats.totalBingos)
      : null;

  return (
    <div className="mt-4">
      <p className="text-muted small text-center mb-2">
        <i className="bi bi-bar-chart-fill me-1" />
        Lifetime stats
      </p>
      <div className="row g-2">
        <StatCard emoji="🔐" value={stats.totalCodes} label="codes entered" />
        <StatCard emoji="🏆" value={stats.totalBingos} label="bingos" />
        <StatCard emoji="⚡" value={stats.bestGame ?? '—'} label="best game" />
        <StatCard emoji="📊" value={avg ?? '—'} label="avg to bingo" />
      </div>
    </div>
  );
}

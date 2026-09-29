interface StatCardProps {
  label: string;
  value: number;
  tone?: 'default' | 'warning';
}

export function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  return (
    <div className="card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={`mt-2 font-serif text-3xl font-semibold ${tone === 'warning' ? 'text-danger' : 'text-ink'}`}>
        {value.toLocaleString('vi-VN')}
      </p>
    </div>
  );
}

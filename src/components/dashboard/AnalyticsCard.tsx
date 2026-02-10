export default function AnalyticsCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-brand-muted uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-brand-dark">{value}</p>
      {helper && <p className="mt-1 text-xs text-brand-muted/80">{helper}</p>}
    </div>
  );
}

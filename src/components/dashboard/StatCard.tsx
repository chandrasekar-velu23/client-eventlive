import type { ComponentType, SVGProps } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export default function StatCard({
  label,
  value,
  helper,
  Icon,
}: StatCardProps) {
  return (
    <div className="card flex items-center justify-between p-5 hover:border-brand-primary/20 transition-all duration-300">
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold font-display text-text-primary tracking-tight">{value}</p>

        {helper && (
          <p className="mt-1 text-xs font-medium text-brand-500">{helper}</p>
        )}
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shadow-sm ring-1 ring-brand-100">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

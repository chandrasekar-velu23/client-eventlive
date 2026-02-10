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
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {helper && (
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        )}
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
        <Icon className="h-5 w-5 text-brand" />
      </div>
    </div>
  );
}

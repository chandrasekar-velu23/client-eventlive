import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";

type QuickActionCardProps = {
  label: string;
  description?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  to?: string;
  onClick?: () => void;
};

export default function QuickActionCard({
  label,
  description,
  Icon,
  to,
  onClick,
}: QuickActionCardProps) {
  const content = (
    <div className="flex flex-col gap-1 w-full text-left">
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 ring-1 ring-brand-100 group-hover:ring-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-bold text-text-primary group-hover:text-brand-700 transition-colors">{label}</span>
      </div>
      {description && <p className="text-xs text-muted font-medium ml-1 group-hover:text-text-primary/80 transition-colors">{description}</p>}
    </div>
  );

  const className = "group card flex items-start gap-3 p-4 hover:shadow-lg hover:border-brand-200 hover:-translate-y-1 transition-all duration-300 w-full cursor-pointer";

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

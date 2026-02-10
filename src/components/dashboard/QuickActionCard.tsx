import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";

type QuickActionCardProps = {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  to?: string;
  onClick?: () => void;
};

export default function QuickActionCard({
  label,
  Icon,
  to,
  onClick,
}: QuickActionCardProps) {
  const content = (
    <>
      <Icon className="h-5 w-5 text-brand-primary" />
      <span className="font-bold text-brand-dark">{label}</span>
    </>
  );

  const className = "flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-white p-4 text-sm font-medium shadow-sm hover:border-brand-primary/50 hover:shadow-md transition-all";

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

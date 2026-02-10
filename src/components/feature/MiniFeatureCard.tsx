import type { ComponentType, SVGProps } from "react";

type MiniFeatureCardProps = {
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export default function MiniFeatureCard({
  title,
  description,
  Icon,
}: MiniFeatureCardProps) {
  return (
    <div className="card group p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface text-brand-primary shadow-sm transition-colors group-hover:bg-brand-primary group-hover:text-white">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <h4 className="text-base font-bold text-brand-dark">
        {title}
      </h4>
      
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">
        {description}
      </p>
    </div>
  );
}
import type { ComponentType, SVGProps } from "react";

type FeatureCardProps = {
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export default function FeatureCard({
  title,
  description,
  Icon,
}: FeatureCardProps) {
  return (
    <div
      className="
        card
        group
        flex h-full flex-col
        p-8
        transition-all duration-300
        hover:-translate-y-2
        hover:shadow-lg
      "
    >
      
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-surface text-brand-primary shadow-sm transition-colors group-hover:bg-brand-primary group-hover:text-white">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>

  
      <h3 className="text-xl font-bold text-brand-dark">
        {title}
      </h3>

      <p className="mt-3 text-base leading-relaxed text-brand-muted">
        {description}
      </p>
    </div>
  );
}
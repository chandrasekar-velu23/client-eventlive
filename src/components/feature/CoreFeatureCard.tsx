import type { ComponentType, SVGProps } from "react";

type CoreFeatureCardProps = {
  title: string;
  description: string;
  points: string[];
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export default function CoreFeatureCard({
  title,
  description,
  points,
  Icon,
}: CoreFeatureCardProps) {
  return (
    
    <div className="card group p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      
      
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-surface text-brand-primary shadow-sm transition-colors group-hover:bg-brand-primary group-hover:text-white">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>


      <h3 className="text-xl font-bold text-brand-dark">
        {title}
      </h3>


      <p className="mt-2 text-base leading-relaxed text-brand-muted">
        {description}
      </p>

      
      <ul className="mt-6 space-y-3 text-sm text-brand-dark/80">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
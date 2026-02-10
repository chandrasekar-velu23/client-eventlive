import {
  AcademicCapIcon,
  RocketLaunchIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

type TrustItem = {
  title: string;
  description: string;
  points: string[];
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const trustItems: TrustItem[] = [
  {
    title: "Educators & Trainers",
    description: "Deliver interactive courses, workshops, and certifications with full engagement tracking.",
    points: ["Attendance tracking", "Interactive tools", "Certificate support"],
    Icon: AcademicCapIcon,
  },
  {
    title: "Enterprise & HR",
    description: "Host town halls, training sessions, and secure company-wide events.",
    points: ["SSO integration", "Custom branding", "Compliance ready"],
    Icon: BuildingOffice2Icon,
  },
  {
    title: "Startups & Creators",
    description: "Launch products, host AMAs, and grow your audience through events.",
    points: ["Product launches", "Community building", "Monetization"],
    Icon: RocketLaunchIcon,
  },
  {
    title: "Communities",
    description: "Bring people together with conferences, meetups, and networking events.",
    points: ["Networking lounges", "Sponsor showcases", "Hybrid support"],
    Icon: BriefcaseIcon,
  },
];

export default function TrustSection() {
  return (
    
    <section className="section bg-brand-surface/20">
      {/* Heading */}
      <div className="mx-auto mb-14 max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">
          Use Cases
        </p>
        
        <h2 className="section-title mt-3">
          Built for Every <span className="text-brand-primary">Event Type</span>
        </h2>
      
        <p className="text-muted mx-auto mt-4 max-w-2xl text-lg">
          Whether you’re an educator, enterprise, or community leader,
          EVENTLIVE adapts to your unique needs.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2">
        {trustItems.map((item) => (
          <TrustCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

function TrustCard({ title, description, points, Icon }: TrustItem) {
  return (
    <div
      className="
        card
        group
        relative
        p-8
        transition-all duration-300
        hover:-translate-y-2
        hover:shadow-md
      "
    >
      
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-surface text-brand-primary shadow-sm ring-4 ring-white transition-colors group-hover:bg-brand-primary group-hover:text-white">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="text-xl font-bold text-brand-dark">
        {title}
      </h3>

      <p className="mt-2 text-brand-muted">
        {description}
      </p>

      
      <ul className="mt-6 space-y-3 text-sm text-brand-dark/80">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
            {point}
          </li>
        ))}
      </ul>

      <div className="mt-8 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-brand-primary">
        <span>Learn more</span>
        <span className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </div>
  );
}
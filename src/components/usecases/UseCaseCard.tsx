import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type UseCaseCardProps = {
  title: string;
  description: string;
  points: string[];
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  detailedContent?: string; // Optional blog-like content for the popup
};

export default function UseCaseCard({
  title,
  description,
  points,
  Icon,
  detailedContent,
}: UseCaseCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card group p-8 transition-all hover:-translate-y-1 hover:shadow-xl ring-1 ring-brand-accent/10">
        {/* Icon with Brand Background */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-surface text-brand-primary shadow-sm transition-colors group-hover:bg-brand-primary group-hover:text-white">
          <Icon className="h-7 w-7" />
        </div>

        <h3 className="text-xl font-bold text-brand-dark">{title}</h3>
        <p className="mt-3 text-brand-muted leading-relaxed">{description}</p>

        <ul className="mt-6 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-3 text-sm font-medium text-brand-dark/80">
              <span className="h-2 w-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(255,107,0,0.4)]" />
              {point}
            </li>
          ))}
        </ul>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="mt-8 flex items-center gap-1 text-sm font-bold text-brand-primary transition-all hover:gap-2"
        >
          Learn more <span className="text-lg">→</span>
        </button>
      </div>

      {/* Blog-like Popup Dialog */}
      {isModalOpen && (
  <div className="fixed inset-0 z-200 flex items-center justify-center p-4 sm:p-8">
    {/* Backdrop with higher blur for better separation */}
    <div 
      className="fixed inset-0 bg-brand-dark/60 backdrop-blur-md" 
      onClick={() => setIsModalOpen(false)} 
    />
          
<div className="card relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white shadow-2xl animate-fade-up">            <div className="flex items-center justify-between border-b border-brand-accent/10 bg-brand-surface/20 p-6">
              <div className="flex items-center gap-4">
                <Icon className="h-6 w-6 text-brand-primary" />
                <h2 className="text-xl font-bold text-brand-dark">{title}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-brand-accent/20">
                <XMarkIcon className="h-6 w-6 text-brand-dark" />
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-8 prose prose-brand">
              <p className="text-lg font-medium text-brand-dark mb-4">{description}</p>
              <div className="text-brand-muted leading-loose space-y-4">
                {detailedContent || (
                  <p>In this specialized track, <strong>EVENTLIVE</strong> provides the infrastructure needed to scale 
                  your professional virtual events. Our platform ensures high-fidelity streaming, integrated 
                  security via JWT, and real-time engagement tools designed specifically for {title.toLowerCase()}.</p>
                )}
                <h4 className="text-brand-dark font-bold mt-6">Why Choose Us for {title}?</h4>
                <p>We provide a unified dashboard where you can manage attendees, monitor real-time analytics, 
                and ensure your message reaches your audience securely and effectively.</p>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button onClick={() => setIsModalOpen(false)} className="btn-primary px-8">Close Details</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
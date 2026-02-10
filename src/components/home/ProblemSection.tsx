import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CreditCardIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import SectionTitle from "../ui/SectionTitle";

export default function ProblemSolution() {
  return (
    <section className="section bg-brand-bg">
      <SectionTitle title="Why EVENTLIVE Exists" />

      <div className="mx-auto mt-12 grid max-w-6xl gap-8 md:grid-cols-2">
        
        {/* Problem Card */}
        <div className="card border-brand-dark/10 p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark/10 text-brand-dark">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark">
              The Problem
            </h3>
          </div>

          <ul className="space-y-4 text-brand-muted">
            <li className="flex items-center gap-3">
              <Squares2X2Icon className="h-5 w-5 text-brand-dark/40" />
              Fragmented tools across platforms
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-brand-dark/40" />
              Weak security & link sharing risks
            </li>
            <li className="flex items-center gap-3">
              <CreditCardIcon className="h-5 w-5 text-brand-dark/40" />
              Limited monetization control
            </li>
            <li className="flex items-center gap-3">
              <ChartBarIcon className="h-5 w-5 text-brand-dark/40" />
              Poor visibility into attendee engagement
            </li>
          </ul>
        </div>

        {/* Solution Card */}
        <div className="card border-brand-primary/10 p-8 shadow-md ring-1 ring-brand-primary/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-brand-dark">
              The EVENTLIVE Solution
            </h3>
          </div>

          <p className="text-brand-muted leading-relaxed">
            <strong className="font-bold text-brand-dark">EVENTLIVE</strong> brings hosting,
            secure authentication, global payments, real-time engagement, and
            actionable analytics into <span className="font-bold text-brand-primary">one unified platform</span> —
            built to run professional virtual events without complexity.
          </p>

          <div className="mt-8 rounded-xl bg-brand-surface px-5 py-4 text-sm font-semibold text-brand-primary">
            One platform. Secure by design. Built to scale.
          </div>
        </div>
      </div>
    </section>
  );
}
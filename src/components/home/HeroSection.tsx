import Button from "../ui/Button";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (

    <section className="section bg-bg-primary pt-48 pb-24 relative overflow-hidden">
      {/* Decorative Background for 60-30-10 depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50 via-transparent to-transparent -z-10 dark:from-brand-950/50"></div>
      <div className="mx-auto max-w-7xl px-6 text-center">


        <h1 className="animate-fade-up mb-6 text-4xl font-bold text-brand-dark sm:text-5xl lg:text-6xl xl:text-7xl">
          Host Virtual Events{" "}

          <span className="bg-brand-gradient bg-clip-text text-transparent">
            That Inspire
          </span>
        </h1>

        <p className="animate-fade-up mx-auto mb-10 max-w-2xl text-lg text-brand-muted sm:text-xl">
          Create immersive webinars, conferences, and hybrid events with real-time engagement,
          powerful analytics, and seamless attendee experiences.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link to="/get-started">
            <Button>Get Started for Free</Button>
          </Link>
          <Link to="/all-events">
            <Button variant="secondary">Watch Demo</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
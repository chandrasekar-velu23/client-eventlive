

import { Link } from "react-router-dom";
export default function FinalCTA() {
  return (

    <section className="relative w-full bg-brand-primary py-24 text-center overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 mix-blend-overlay"></div>

      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="relative mx-auto max-w-4xl px-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl drop-shadow-sm">
          Ready to Go Live with EVENTLIVE?
        </h2>

        <p className="mt-6 text-lg font-medium text-blue-100 sm:text-xl max-w-2xl mx-auto">
          Create, manage, and scale professional virtual experiences — all from one secure, unified platform.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          {/* Inverted Primary Button: White BG, Brand Text */}
          <Link to="/get-started">
            <button className="px-8 py-4 rounded-full bg-white text-brand-primary font-bold text-lg shadow-xl shadow-brand-900/20 hover:bg-gray-50 hover:scale-105 transition-all duration-300">
              Start Hosting Free
            </button>
          </Link>

          {/* Inverted Secondary Button: Transparent, White Border/Text */}
          <Link to="/all-events">
            <button className="px-8 py-4 rounded-full bg-transparent border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm">
              See How It Works
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
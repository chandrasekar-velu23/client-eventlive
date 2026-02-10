import Button from "../ui/Button";

export default function FeatureHero() {
  return (
    <section className="section bg-brand-bg py-24 text-center">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">
          Platform Features
        </p>

        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-brand-dark sm:text-5xl lg:text-6xl">
          Powerful Tools for{" "}
          <span className="text-brand-primary">Unforgettable Events</span>
        </h1>

        <p className="text-muted mx-auto mt-6 max-w-2xl text-lg sm:text-xl">
          From live streaming to analytics, discover everything you need to create
          engaging virtual experiences at any scale.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button variant="primary" className="px-8 py-4">
            Start Free Trial
          </Button>
          <Button variant="secondary" className="px-8 py-4">
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
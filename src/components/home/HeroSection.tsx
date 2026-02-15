import Button from "../ui/Button";

export default function HeroSection() {
  return (

    <section className="section bg-brand-bg pt-32 pb-24">
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

          <Button>Get Started for Free</Button>
          <Button variant="secondary">Watch Demo</Button>
        </div>
      </div>
    </section>
  );
}
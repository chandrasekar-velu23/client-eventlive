import Button from "../ui/Button";

export default function FeaturesCTA() {
  return (
    <section className="section bg-white text-center">
      <div className="mx-auto max-w-7xl">
        <h2 className="section-title">
          Ready to Get Started?
        </h2>

        <p className="text-muted mx-auto mt-4 max-w-2xl text-lg">
          Create your first event in minutes. No credit card required.
        </p>

        <div className="mt-10">
          <Button variant="primary" className="px-10 py-4 text-base">
            Get started
          </Button>
        </div>
      </div>
    </section>
  );
}
import Button from "../ui/Button";
import SectionTitle from "../ui/SectionTitle";

export default function PricingSection() {
  return (
    <section className="py-20 bg-brandBg">
      <SectionTitle title="Simple, Transparent Pricing" />

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
        {["Starter", "Pro", "Enterprise"].map((plan) => (
          <div key={plan} className="bg-white rounded-xl p-6 text-center">
            <h3 className="font-bold text-lg">{plan}</h3>
            <p className="mt-4 text-gray-600">Great for getting started</p>
            <div className="mt-6">
              <Button>Get Started</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

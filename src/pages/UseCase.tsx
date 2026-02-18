import UseCasesSection from "../components/home/UseCasesSection";

export default function UseCases() {
  return (
    <>
      <div> {/* Full bleed container */}
        {/* Static Hero Section */}
        <section className="relative h-[650px] w-full overflow-hidden bg-brand-dark pt-20">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&q=80)` }}
          />

          {/* Blur/Overlay Layer */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
              Events <span className="block text-brand-primary mt-2">That Inspire</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg md:text-xl text-gray-100 font-medium drop-shadow-md">
              Built for the scale of enterprise and the intimacy of community.
              <br className="hidden md:block" /> Experience events like never before.
            </p>
          </div>
        </section>
      </div>
      <UseCasesSection />
    </>
  );
}
import { AcademicCapIcon, BuildingOffice2Icon, RocketLaunchIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
// import PageLayout from "../components/layout/PageLayout";
import UseCaseCard from "../components/usecases/UseCaseCard";

const carouselImages = [
  { url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80", title: "Global Webinars" },
  { url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80", title: "Enterprise Town Halls" },
  { url: "https://images.unsplash.com/photo-1591115765373-520b7a21715b?auto=format&fit=crop&w=1200&q=80", title: "Interactive Workshops" },
];

export default function UseCases() {
  return (
    <>
    <div className="pt-20"> {/* Header Offset */}
      {/* Hero Section */}
      <section className="flex h-100 md:h-200 w-full overflow-hidden bg-brand-dark">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000 }}
          pagination={{ clickable: true }}
          className="h-full w-full"
        >
          {carouselImages.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className="relative h-full w-full">
                <img 
                  src={img.url} 
                  alt={img.title} 
                  className="h-full w-full object-cover opacity-50" 
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <h1 className="text-4xl md:text-6xl font-extrabold text-white">
                    Events <span className="text-brand-primary">That Inspire</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-lg text-white/80">
                    Built for the scale of enterprise and the intimacy of community.
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
      </div>
<div>
      {/* Content Section */}
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            <UseCaseCard
              title="Educators & Trainers"
              description="Deliver interactive courses and workshops with full engagement tracking."
              points={["Attendance tracking", "Interactive tools", "Certificate support"]}
              Icon={AcademicCapIcon}
              detailedContent="Professional education requires more than just a video link. EVENTLIVE provides dynamic polling and breakout rooms."
            />

            <UseCaseCard
              title="Enterprise & HR"
              description="Host town halls and secure company-wide training sessions."
              points={["SSO integration", "Custom branding", "Compliance ready"]}
              Icon={BuildingOffice2Icon}
            />

            <UseCaseCard
              title="Startups & Creators"
              description="Launch products and host AMAs to grow your audience."
              points={["Product launches", "Community building", "Monetization"]}
              Icon={RocketLaunchIcon}
            />

            <UseCaseCard
              title="Communities"
              description="Bring people together with meetups and networking lounges."
              points={["Networking lounges", "Sponsor showcases", "Hybrid support"]}
              Icon={UsersIcon}
            />
          </div>
        </div>
      </div>
    </>
  );
}
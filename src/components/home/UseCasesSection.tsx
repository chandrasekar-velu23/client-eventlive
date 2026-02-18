import { AcademicCapIcon, BuildingOffice2Icon, RocketLaunchIcon, UsersIcon } from "@heroicons/react/24/outline";
import UseCaseCard from "../usecases/UseCaseCard";
import SectionTitle from "../ui/SectionTitle";

export default function UseCasesSection() {
    return (
        <section className="section bg-bg-secondary">
            <SectionTitle
                title="Tailored for Every Need"
                subtitle="Whatever your event type, EVENTLIVE provides the tools to make it a success."
            />

            <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 px-6">
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
        </section>
    );
}

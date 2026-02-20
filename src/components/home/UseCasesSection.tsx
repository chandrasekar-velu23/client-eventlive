import { AcademicCapIcon, BuildingOffice2Icon, RocketLaunchIcon, UsersIcon } from "@heroicons/react/24/outline";
import UseCaseCard from "../usecases/UseCaseCard";
import SectionTitle from "../ui/SectionTitle";

export default function UseCasesSection() {
    return (
        <section className="section bg-bg-secondary">
            <SectionTitle
                title="Built for Every Type of Event Organizer"
                subtitle="Whether you're educating, training, launching, or building communities — EventLive adapts to your goals."
            />

            <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 px-6">
                <UseCaseCard
                    title="Educators & Trainers"
                    description="Deliver interactive courses and workshops with full engagement tracking."
                    points={["Attendance & participation tracking", "Live polls & Q&A", "Resource sharing"]}
                    Icon={AcademicCapIcon}
                    detailedContent="Professional education requires more than just a video link. EVENTLIVE provides dynamic polling and breakout rooms."
                />

                <UseCaseCard
                    title="Enterprise & HR"
                    description="Host town halls and secure company-wide training sessions."
                    points={["Role-based access control", "Custom branding", "Secure authentication"]}
                    Icon={BuildingOffice2Icon}
                />

                <UseCaseCard
                    title="Startups & Creators"
                    description="Launch products and host AMAs to grow your audience."
                    points={["Registration automation", "Engagement analytics", "Lead capture"]}
                    Icon={RocketLaunchIcon}
                />

                <UseCaseCard
                    title="Communities"
                    description="Bring people together with meetups and networking lounges."
                    points={["Breakout small groups", "Sponsor showcases", "Engagement tracking"]}
                    Icon={UsersIcon}
                />
            </div>
        </section>
    );
}

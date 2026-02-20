import {
  VideoCameraIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import SectionTitle from "../ui/SectionTitle";
import FeatureCard from "../ui/FeatureCard";

const features = [
  {
    title: "Live Streaming",
    description: "Broadcast high-quality live sessions with reliable, low-latency streaming.",
    Icon: VideoCameraIcon,
  },
  {
    title: "Control Room",
    description: "Create smaller group sessions for workshops, conferences, meetings and discussions.",
    Icon: UsersIcon,
  },
  {
    title: "Real-time Chat",
    description: "Enable live discussions with moderation tools and audience reactions.",
    Icon: ChatBubbleLeftRightIcon,
  },
  {
    title: "Live Polls & Q&A",
    description: "Engage attendees with interactive polls and real-time Q&A sessions.",
    Icon: ChartBarIcon,
  },
  {
    title: "Event Scheduling",
    description: "Manage multi-track agendas, speakers, and sessions from one place.",
    Icon: CalendarDaysIcon,
  },
  {
    title: "Enterprise Security",
    description: "Protect events with secure authentication, access control, and data safety.",
    Icon: ShieldCheckIcon,
  },
];

export default function FeaturesSection() {
  return (
    <section className="section bg-bg-secondary border-t border-brand-accent">
      <SectionTitle
        title="Your Complete Virtual Event Infrastructure"
        subtitle="From registration to real-time engagement and post-event insights — everything runs on one powerful platform."
      />

      <div className="mx-auto mt-14 grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (

          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
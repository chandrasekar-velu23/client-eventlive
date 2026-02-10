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
    title: "Breakout Rooms",
    description: "Create smaller group sessions for workshops, networking, and collaboration.",
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
    <section className="section bg-white">
      <SectionTitle
        title="Everything You Need to Host Amazing Events"
        subtitle="From live streaming to analytics, EVENTLIVE gives you the tools to create memorable virtual experiences."
      />

      <div className="mx-auto mt-14 grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
      
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
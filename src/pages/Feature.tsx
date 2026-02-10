import FeatureHero from "../components/feature/FeatureHero";
import CoreFeatureCard from "../components/feature/CoreFeatureCard";
import MiniFeatureCard from "../components/feature/MiniFeatureCard";
import FeaturesCTA from "../components/feature/FeaturesCTA";

import {
  VideoCameraIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  MicrophoneIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

export default function Features() {
  return (
    <>
      <FeatureHero />

      {/* Core Features */}
      <section className="bg-white py-20 px-6">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Core Features
        </h2>
        <p className="mt-2 text-center text-gray-600">
          Everything you need to host professional virtual events
        </p>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2">
          <CoreFeatureCard
            title="HD Live Streaming"
            description="Broadcast crystal-clear video to unlimited attendees with ultra-low latency."
            points={["4K support", "Screen sharing", "Recording & replay"]}
            Icon={VideoCameraIcon}
          />

          <CoreFeatureCard
            title="Breakout Rooms"
            description="Create focused small-group sessions for collaboration."
            points={["Auto assignment", "Timed sessions", "Host controls"]}
            Icon={UsersIcon}
          />

          <CoreFeatureCard
            title="Interactive Chat"
            description="Enable real-time conversations and moderated discussions."
            points={["Threaded replies", "Emoji reactions", "File sharing"]}
            Icon={ChatBubbleLeftRightIcon}
          />

          <CoreFeatureCard
            title="Polls & Q&A"
            description="Boost engagement with live audience interaction."
            points={["Live results", "Upvoting", "Speaker queue"]}
            Icon={ChartBarIcon}
          />
        </div>
      </section>

      {/* And Much More */}
      <section className="bg-brand-bg py-20 px-6">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          And Much More
        </h2>
        <p className="mt-2 text-center text-gray-600">
          Explore the full suite of tools to power your events
        </p>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">
          <MiniFeatureCard title="Multi-track Agenda" description="Parallel sessions" Icon={CalendarDaysIcon} />
          <MiniFeatureCard title="Resource Sharing" description="Slides & materials" Icon={BoltIcon} />
          <MiniFeatureCard title="Enterprise Security" description="SSO & encryption" Icon={ShieldCheckIcon} />
          <MiniFeatureCard title="Real-time Analytics" description="Live insights" Icon={ChartBarIcon} />
          <MiniFeatureCard title="Speaker Management" description="Green room & notes" Icon={MicrophoneIcon} />
          <MiniFeatureCard title="Multi-language" description="Localization support" Icon={GlobeAltIcon} />
          <MiniFeatureCard title="Custom Branding" description="White-label events" Icon={ShieldCheckIcon} />
          <MiniFeatureCard title="Smart Notifications" description="Email & alerts" Icon={BellIcon} />
        </div>
      </section>

      <FeaturesCTA />
    </>
  );
}

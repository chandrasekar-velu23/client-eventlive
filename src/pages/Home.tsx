import HeroSection from "../components/home/HeroSection";
import TrustSection from "../components/home/TrustSection";
import ProblemSolution from "../components/home/ProblemSection";
import FeaturesSection from "../components/home/FeatureSection";
// import PricingSection from "../components/home/PricingSection";
import FinalCTA from "../components/home/FinalCTA";

import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      logout();
      // Optional: don't notify if annoying, but confirms action
      // toast("You have been logged out as you returned to the home page.");
    }
  }, [user, logout]);

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ProblemSolution />
      <TrustSection />
      {/* <PricingSection /> */}
      <FinalCTA />
    </>
  );
}

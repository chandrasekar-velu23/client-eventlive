import HeroSection from "../components/home/HeroSection";
import TrustSection from "../components/home/TrustSection";
import ProblemSolution from "../components/home/ProblemSection";
import FeaturesSection from "../components/home/FeatureSection";
import FinalCTA from "../components/home/FinalCTA";

import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user) {
      logout();
    }
  }, [user, logout]);

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ProblemSolution />
      <TrustSection />
      <FinalCTA />
    </>
  );
}

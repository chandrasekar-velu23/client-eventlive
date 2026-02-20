import HeroSection from "../components/home/HeroSection";
import ProblemSolution from "../components/home/ProblemSection";
import FeaturesSection from "../components/home/FeatureSection";
import UseCasesSection from "../components/home/UseCasesSection";
import FinalCTA from "../components/home/FinalCTA";
import Footer from "../components/layout/Footer";

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
      <UseCasesSection />
      <ProblemSolution />
      <FinalCTA />
      <Footer />
    </>
  );
}

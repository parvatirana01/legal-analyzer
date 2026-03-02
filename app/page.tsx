import { LandingNav } from "./_components/landing-nav";
import { HeroSection } from "./_components/hero-section";
import { FeaturesSection } from "./_components/features-section";
import { HowItWorksSection } from "./_components/how-it-works-section";
import { PricingSection } from "./_components/pricing-section";
import { LandingFooter } from "./_components/landing-footer";

// ─────────────────────────────────────────────
// Landing Page (Server Component)
// ─────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <LandingFooter />
    </div>
  );
}

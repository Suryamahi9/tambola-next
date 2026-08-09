import Hero from "@/components/landing/Hero";
import FAQ from "@/components/landing/FAQ";
import TambolaSceneLoader from "@/components/landing/TambolaSceneLoader";
import {
  CTA,
  Features,
  HowItWorks,
  Pricing,
  Testimonials,
} from "@/components/landing/sections";

export default function Home() {
  return (
    <>
      <TambolaSceneLoader />
      <Hero />
      <div className="relative border-y border-white/10 bg-white/[0.03]">
        <Features />
      </div>
      <div className="relative bg-white/[0.04]">
        <HowItWorks />
      </div>
      <div className="relative border-y border-white/10 bg-white/[0.03]">
        <Pricing />
      </div>
      <div className="relative bg-white/[0.04]">
        <Testimonials />
      </div>
      <div className="relative border-y border-white/10 bg-white/[0.03]">
        <FAQ />
        <CTA />
      </div>
    </>
  );
}

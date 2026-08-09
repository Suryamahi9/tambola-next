import Hero from "@/components/landing/Hero";
import FAQ from "@/components/landing/FAQ";
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
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}

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
      <div className="relative bg-white/80 backdrop-blur-md dark:bg-[#070a16]/80">
        <Features />
      </div>
      <div className="relative border-y border-neutral-200/70 bg-white/85 backdrop-blur-lg dark:border-neutral-800/70 dark:bg-[#070a16]/85">
        <HowItWorks />
      </div>
      <div className="relative bg-white/80 backdrop-blur-md dark:bg-[#070a16]/80">
        <Pricing />
      </div>
      <div className="relative border-y border-neutral-200/70 bg-white/85 backdrop-blur-lg dark:border-neutral-800/70 dark:bg-[#070a16]/85">
        <Testimonials />
      </div>
      <div className="relative bg-white/80 backdrop-blur-md dark:bg-[#070a16]/80">
        <FAQ />
        <CTA />
      </div>
    </>
  );
}

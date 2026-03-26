import HeroSection from "@/components/sections/HeroSection";
import WhatIsMela from "@/components/sections/WhatIsMela";
import WhoThisIsFor from "@/components/sections/WhoThisIsFor";
import ContentPillars from "@/components/sections/ContentPillars";
import ServicesSection from "@/components/sections/ServicesSection";
import ResourcesSection from "@/components/sections/ResourcesSection";
import BlogCTASection from "@/components/sections/BlogCTASection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Home",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhatIsMela />
      <WhoThisIsFor />
      <ContentPillars />
      <ServicesSection />
      <ResourcesSection />
      <div className="mx-auto max-w-5xl px-6">
        <div className="h-px bg-border/60" />
      </div>
      <BlogCTASection />
      <FinalCTASection />
    </>
  );
}
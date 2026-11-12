import CaseStudies from "@/components/sections/case-studies";
import ContentWall from "@/components/sections/content-wall";
import TeamGrid from "@/components/sections/team-grid";
import Reviews from "@/components/sections/reviews";
import HowWeWork from "@/components/sections/how-we-work";
import TheNumbers from "@/components/sections/the-numbers";
import ClientRadar from "@/components/sections/client-radar";
import HomeHero from "@/components/sections/home-hero";
import ServicesBoard from "@/components/sections/services-board";
import WhyReachwise from "@/components/sections/why-reachwise";
import { siteConfig } from "@/constants/site";

export const metadata = {
  title: "Get seen by the right crowd",
  description: siteConfig.sub,
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <HomeHero />
      <ClientRadar />
      <WhyReachwise />
      <ServicesBoard />
      <CaseStudies />
      <HowWeWork />
      <TheNumbers />
      <ContentWall />
      <TeamGrid />
      <Reviews />
    </main>
  );
}

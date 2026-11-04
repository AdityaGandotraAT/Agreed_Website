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
    </main>
  );
}

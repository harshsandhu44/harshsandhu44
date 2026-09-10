import { FarmPortfolio } from "@/components/farm/farm-portfolio";
import { PortfolioFallback } from "@/components/farm/portfolio-fallback";

export default function Home() {
  return (
    <>
      <PortfolioFallback />
      <FarmPortfolio />
    </>
  );
}

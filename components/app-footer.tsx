import Link from "next/link";
import { ArrowBigRightIcon } from "lucide-react";
import { DATA } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function AppFooter() {
  const { tagline, subTagline, cta } = DATA.footer;
  const { email } = DATA.global;

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-4xl md:text-6xl font-black mb-4">{tagline}</h2>
        <p className="text-center max-w-xl">{subTagline}</p>
        <Button asChild variant="secondary" className="mt-4">
          <Link href={`mailto:${email}`}>
            {cta} <ArrowBigRightIcon />
          </Link>
        </Button>
      </div>
    </footer>
  );
}

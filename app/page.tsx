import Link from "next/link";
import { ArrowBigDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto px-2 md:px-4 max-w-7xl">
      <section
        className="py-24 min-h-dvh flex flex-col items-center justify-center text-center space-y-4"
        id="hero-section"
      >
        <Badge variant="outline" className="px-3 py-1 italic">
          Currently optimizing my dotfiles (again).
        </Badge>
        <h1 className="text-5xl md:text-7xl font-black max-w-prose">
          I build pixel-perfect{" "}
          <span className="text-muted-foreground">chaos</span> for the web.
        </h1>
        <p className="text-xl max-w-prose">
          Full-Stack Engineer & Digital Architect. I turn coffee into clean code
          and complex problems into simple solutions.
        </p>
        <Button asChild className="mt-4" size="lg">
          <Link href="#journey-section">
            See what I&apos;ve been cooking <ArrowBigDownIcon />
          </Link>
        </Button>
      </section>

      <section className="py-24" id="journey-section">
        <h2>Journey Section Placeholder</h2>
      </section>
    </div>
  );
}

HomePage.displayName = "HomePage";

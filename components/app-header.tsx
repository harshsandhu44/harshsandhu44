"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const config = {
  "text-primary-foreground": ["/about"],
};

export function AppHeader() {
  const path = usePathname();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-in-out",
        config["text-primary-foreground"].includes(path) &&
          "text-primary-foreground",
        scrolled
          ? "bg-background/80 text-foreground backdrop-blur-md py-2"
          : "bg-transparent py-4",
      )}
    >
      <div className="px-4 max-w-7xl mx-auto grid grid-cols-2 items-center gap-4 transition-all duration-300">
        <span className="font-black text-lg">Harsh Sandhu</span>

        <div className="place-self-end self-center flex flex-row-reverse md:flex-row items-center gap-6">
          <Navbar />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

AppHeader.displayName = "AppHeader";

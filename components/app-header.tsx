"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

export function AppHeader() {
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
        "fixed top-0 inset-x-0 bg-transparent z-50 transition-all duration-300 ease-in-out",
        scrolled && "backdrop-blur-sm",
      )}
    >
      <div className="px-4 h-24 max-w-7xl mx-auto grid grid-cols-2 items-center gap-4 transition-all duration-300">
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

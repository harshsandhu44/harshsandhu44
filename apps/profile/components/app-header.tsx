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
        "sticky top-0 inset-x-0 bg-transparent z-50 transition-all duration-300 ease-in-out border-b border-border",
        scrolled && "backdrop-blur-sm",
      )}
    >
      <div
        className={cn(
          "container grid grid-cols-2 items-center gap-4 transition-all duration-300",
          scrolled ? "h-16" : "h-24",
        )}
      >
        <span className="font-serif font-bold text-lg">Harsh Sandhu</span>

        <div className="place-self-end self-center flex flex-row-reverse md:flex-row items-center gap-6">
          <Navbar />
          <ThemeToggle showLabel />
        </div>
      </div>
    </header>
  );
}

AppHeader.displayName = "AppHeader";

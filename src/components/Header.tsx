"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="container h-24 flex items-center justify-between">
      <Link
        href="/"
        className={cn(
          "text-sm font-medium",
          pathname === "/" && "underline underline-offset-4"
        )}
      >
        Home
      </Link>
    </header>
  );
};

export default Header;

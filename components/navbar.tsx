"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const mobile = useMediaQuery("(max-width: 768px)");
  const path = usePathname();

  const navItems = [
    { label: "home", href: "/" },
    { label: "about", href: "/about" },
    { label: "resume", href: "/resume" },
  ];

  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger className="place-self-end self-center">
          <span className="uppercase font-medium">Menu</span>
        </DrawerTrigger>
        <DrawerContent className="h-dvh">
          <DrawerHeader className="invisible">
            <DrawerTitle>Harsh Sandhu</DrawerTitle>
            <DrawerDescription>Sr. Software Engineer</DrawerDescription>
          </DrawerHeader>

          <nav className="p-4 w-full flex flex-col items-start justify-center gap-12">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-3xl text-center font-bold capitalize",
                  path === item.href && "text-primary",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </DrawerContent>
      </Drawer>
    );
  } else {
    return (
      <nav className="place-self-stretch self-center grid grid-cols-3 place-content-center gap-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="text-center font-medium capitalize"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }
}

Navbar.displayName = "Navbar";

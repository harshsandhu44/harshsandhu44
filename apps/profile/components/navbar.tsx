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
import { DividerRule } from "@/components/editorial";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const mobile = useMediaQuery("(max-width: 768px)");
  const path = usePathname();

  const navItems = [
    { label: "home", href: "/" },
    { label: "about", href: "/about" },
    { label: "projects", href: "/projects" },
    {
      label: "resume",
      href: process.env.NEXT_PUBLIC_RESUME_URL || "",
      external: true,
    },
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

          <nav className="p-4 w-full flex flex-col items-start justify-center gap-0">
            <DividerRule className="w-full mb-8" />
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "font-serif font-bold text-2xl capitalize py-4 border-b border-border w-full",
                  path === item.href && "text-primary",
                )}
                onClick={() => setOpen(false)}
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
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
      <nav className="place-self-stretch self-center grid grid-cols-4 place-content-center gap-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "text-center font-mono text-xs uppercase tracking-[0.12em]",
              path === item.href && "text-primary",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }
}

Navbar.displayName = "Navbar";

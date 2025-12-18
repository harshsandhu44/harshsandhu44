"use client";

import React from "react";
import Link, { type LinkProps } from "next/link";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

type AnchorProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps
> &
  LinkProps & {
    children: React.ReactNode;
  };

export function AnchorLink({ children, className, ...props }: AnchorProps) {
  const { href, ...rest } = props;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    gsap.to(window, {
      duration: 1,
      scrollTo: { y: href as string },
    });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className} // Now properly typed and passed
      {...rest}
    >
      {children}
    </Link>
  );
}

AnchorLink.displayName = "AnchorLink";

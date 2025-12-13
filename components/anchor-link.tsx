"use client";

import React from "react";
import Link, { type LinkProps } from "next/link";
import { useLenis } from "lenis/react";

type AnchorProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps
> &
  LinkProps & {
    children: React.ReactNode;
  };

export function AnchorLink({ children, className, ...props }: AnchorProps) {
  const { href, ...rest } = props;
  const lenis = useLenis();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    lenis?.scrollTo(href as string, { offset: -96 });
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

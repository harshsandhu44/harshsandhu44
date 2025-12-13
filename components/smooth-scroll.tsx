"use client";

import { ReactLenis } from "lenis/react";
import { type PropsWithChildren } from "react";

export function SmoothScroll({ children }: PropsWithChildren) {
  return (
    <ReactLenis root options={{ lerp: 0.5, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}

SmoothScroll.displayName = "SmoothScroll";

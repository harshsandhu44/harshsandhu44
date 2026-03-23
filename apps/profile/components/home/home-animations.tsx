"use client";

import { useRef } from "react";
import { useAnimateOnScroll } from "@harshsandhu44/utils/animations";

export function HomeAnimations({ children }: { children: React.ReactNode }) {
  const containerRef = useRef(null);
  useAnimateOnScroll(containerRef);

  return <div ref={containerRef}>{children}</div>;
}

HomeAnimations.displayName = "HomeAnimations";

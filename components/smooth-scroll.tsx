"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollSmoother from "gsap/ScrollSmoother";
import ScrollTrigger from "gsap/ScrollTrigger";
import { type PropsWithChildren, useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

export function SmoothScroll({ children }: PropsWithChildren) {
  const wrapper = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      ScrollSmoother.create({
        smooth: 2,
        effects: true,
        ease: "power4.out",
      });
    },
    { scope: wrapper },
  );

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content">{children}</div>
    </div>
  );
}

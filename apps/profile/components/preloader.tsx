"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function Preloader() {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement | null>(null);

  // Set initial hidden state once
  useGSAP(
    () => {
      gsap.set(".rt-overlay", { autoAlpha: 0 });
      gsap.set(".rt-line", { yPercent: 120 });
    },
    { scope: root },
  );

  useEffect(() => {
    // Runs on first load + every route change because pathname updates. [page:40]
    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    tl.set(".rt-overlay", { autoAlpha: 1 })
      .to(".rt-line", { yPercent: 0, duration: 0.5, stagger: 0.06 })
      .to(
        ".rt-line",
        { yPercent: -120, duration: 0.35, stagger: 0.04 },
        "+=0.15",
      )
      .to(".rt-overlay", { autoAlpha: 0, duration: 0.2 });

    return () => {
      tl.kill();
    };
  }, [pathname]); // pathname updates on navigation. [page:40]

  return (
    <div
      ref={root}
      className="rt-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "#0b0b0b",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          overflow: "hidden",
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        <div className="rt-line">Loading</div>
        <div className="rt-line">{pathname}</div>
      </div>
    </div>
  );
}

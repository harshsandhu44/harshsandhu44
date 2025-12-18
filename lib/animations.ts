import { ReactRef, useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

export const useAnimateOnScroll = (scope?: string | ReactRef | Element) => {
  useGSAP(
    () => {
      const sections = gsap.utils.toArray<HTMLElement>('[id^="section-"]');
      sections.forEach((section) => {
        gsap.fromTo(
          section.children,
          { y: "+=30", opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 1,
            duration: 2,
            ease: "power4.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "top 20%",
              scrub: true,
            },
          },
        );
      });
    },
    { scope },
  );
};

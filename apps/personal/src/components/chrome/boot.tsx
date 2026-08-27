"use client";

import { useEffect, useState } from "react";
import { useFirstVisitThisSession } from "#lib/persisted";

const SEEN_KEY = "hs.booted";

const CHECKS = [
  "board    harshsandhu.com",
  "mem      profile · experience · projects   ok",
  "wm       bsp tiler mounted",
  "shell    ready",
];

/* The one orchestrated moment on the site, and it is over in about a second.
 * Skipped on return visits, under reduced motion, and by any key or click —
 * nobody should have to watch this twice. */
export function Boot() {
  const shouldPlay = useFirstVisitThisSession(SEEN_KEY);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!shouldPlay) return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Worst case it plays again on the next navigation.
    }

    const skip = () => setDismissed(true);
    const timer = setTimeout(skip, 1100);
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [shouldPlay]);

  if (!shouldPlay || dismissed) return null;

  return (
    <div
      aria-hidden
      className="bg-ground z-60 fixed inset-0 flex items-center justify-center"
      style={{ animation: "boot-out 250ms ease-out 850ms forwards" }}
    >
      <pre className="text-silk-dim font-mono text-xs leading-loose">
        {CHECKS.map((line, index) => (
          <span
            key={line}
            className="block opacity-0"
            style={{
              animation: `boot-line 160ms ease-out ${index * 130}ms forwards`,
            }}
          >
            {line}
          </span>
        ))}
      </pre>
    </div>
  );
}

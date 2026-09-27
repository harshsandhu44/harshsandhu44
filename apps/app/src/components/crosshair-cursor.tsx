"use client";

import { useEffect, useRef } from "react";

// Full-viewport crosshair that replaces the native cursor on fine pointers.
// The box turns apricot over anything clickable, since the link hand is gone.
// Its background-coloured ring keeps it visible over filled buttons (apricot in dark mode).
export function CrosshairCursor({ readout = true }: { readout?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const v = useRef<HTMLDivElement>(null);
  const h = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    const html = document.documentElement;
    // Held locally: the ref is already null when the cleanup below runs.
    const wrap = root.current!;
    // data-xh hides the native cursor (globals.css); off until the first move so
    // the page never sits cursorless with the crosshair parked at 0,0.
    const show = (on: boolean) => {
      html.toggleAttribute("data-xh", on);
      wrap.hidden = !on;
    };
    let raf = 0,
      x = 0,
      y = 0,
      hot = false;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x = Math.round(e.clientX);
      y = Math.round(e.clientY);
      hot = !!(e.target as Element).closest("a,button,[role=button]");
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        show(true);
        v.current!.style.transform = `translate3d(${x}px,0,0)`;
        h.current!.style.transform = `translate3d(0,${y}px,0)`;
        box.current!.style.transform = `translate3d(${x}px,${y}px,0)`;
        box.current!.toggleAttribute("data-hot", hot);
        if (tag.current) {
          tag.current.style.transform = `translate3d(${x + 13}px,${y + 13}px,0)`;
          tag.current.textContent = `${x} · ${y}`;
        }
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      show(false);
    };
    addEventListener("pointermove", move, { passive: true });
    html.addEventListener("pointerleave", leave);
    return () => {
      removeEventListener("pointermove", move);
      html.removeEventListener("pointerleave", leave);
      leave();
    };
  }, []);

  return (
    <div
      ref={root}
      hidden
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <div ref={v} className="absolute top-0 left-0 h-full w-px bg-natural/35" />
      <div ref={h} className="absolute top-0 left-0 h-px w-full bg-natural/35" />
      <div
        ref={box}
        className="absolute top-0 left-0 size-2.5 -translate-1/2 border border-foreground ring-1 ring-background transition-[width,height,border-color] duration-150 data-hot:size-4 data-hot:border-accent"
      />
      {/* ponytail: tag clips at the right/bottom edge; flip it inward if that bothers you. */}
      {readout && (
        <div
          ref={tag}
          className="absolute top-0 left-0 rounded-sm bg-background/80 px-1 text-xs text-muted-foreground tabular-nums"
        />
      )}
    </div>
  );
}

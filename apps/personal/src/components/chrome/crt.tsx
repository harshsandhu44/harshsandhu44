"use client";

/* One fixed compositor layer, no per-pane cost. The constraint that shaped it:
 * body text has to clear WCAG AA *through* this, so the scanline alpha stays
 * low enough that silkscreen-on-surface never drops below ~13:1. Flicker is
 * amplitude 0.015 — visible as life, not as strobing — and is removed entirely
 * under prefers-reduced-motion. Dropped below 768px, where it costs more on a
 * phone GPU than it gives. */
export function Crt({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 hidden md:block"
      style={{ contain: "strict" }}
    >
      <div className="crt-scan absolute inset-0" />
      <div className="crt-vignette absolute inset-0" />
    </div>
  );
}

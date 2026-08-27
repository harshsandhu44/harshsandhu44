"use client";

import { useRef } from "react";
import { rects } from "./tree";
import { useWm } from "./provider";
import { Pane } from "./pane";
import { SECTIONS } from "./views";

const FRAME = { x: 0, y: 0, w: 100, h: 100 };

/* Panes are absolutely positioned from the tree's computed rectangles rather
 * than nested flexboxes. Same result at rest, but every pane keeps its DOM node
 * across a split, so the browser animates the redistribution for free — which
 * is the one moment where you can see the tree is real. */
export function Tiler({ panes }: { panes: Record<string, React.ReactNode> }) {
  const { tree, focus, isNarrow } = useWm();
  const geometry = rects(tree, FRAME);

  if (isNarrow) return <NarrowTiler panes={panes} />;

  return (
    <div className="relative min-h-0 flex-1 p-[var(--pane-outer)]">
      {[...geometry].map(([view, r]) => (
        <div
          key={view}
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: `${r.w}%`,
            height: `${r.h}%`,
          }}
          className="absolute p-[var(--pane-gap-half)] transition-[left,top,width,height] duration-200 ease-out motion-reduce:transition-none"
        >
          <Pane view={view}>{panes[view]}</Pane>
        </div>
      ))}
      <span className="sr-only" aria-live="polite">
        {`${geometry.size} panes open, ${focus} focused`}
      </span>
    </div>
  );
}

/* Below 768px the tree still exists — it just draws its focused leaf, full
 * bleed. Same components, same URLs, no second design. */
function NarrowTiler({ panes }: { panes: Record<string, React.ReactNode> }) {
  const { focus, open } = useWm();
  const touch = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(event: React.TouchEvent) {
    const t = event.touches[0]!;
    touch.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = event.changedTouches[0]!;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    const order: string[] = SECTIONS.map((s) => s.view);
    const at = order.indexOf(focus);
    if (at === -1) return;
    const next = order[at + (dx < 0 ? 1 : -1)];
    if (next) open(next);
  }

  return (
    <div
      className="relative min-h-0 flex-1 p-[var(--pane-edge)]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Pane view={focus}>{panes[focus]}</Pane>
    </div>
  );
}

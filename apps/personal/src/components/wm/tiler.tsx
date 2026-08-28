"use client";

import { useRef, useState } from "react";
import { cn } from "@harshsandhu44/ui/lib/utils";
import {
  type Divider,
  type Edge,
  type Node,
  type Rect,
  dividers,
  rects,
  resizeAt,
} from "./tree";
import { useWm } from "./provider";
import { Pane } from "./pane";
import { SECTIONS } from "./views";

const FRAME: Rect = { x: 0, y: 0, w: 100, h: 100 };

/** Pointer travel before a header press becomes a drag. Below this it is still
 * a click, so focusing a pane by its title never accidentally moves it. */
const DRAG_THRESHOLD = 6;

type Resizing = { divider: Divider; origin: number; base: Node };
type Moving = { view: string; target: string | null; edge: Edge | null };

/* Panes are absolutely positioned from the tree's computed rectangles rather
 * than nested flexboxes. Same result at rest, but every pane keeps its DOM node
 * across a split, so the browser animates the redistribution for free — which
 * is the one moment where you can see the tree is real. */
export function Tiler({ panes }: { panes: Record<string, React.ReactNode> }) {
  const { tree, focus, isNarrow, commitResize, dropPane } = useWm();
  const frameRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<Resizing | null>(null);
  const [preview, setPreview] = useState<Node | null>(null);
  const [moving, setMoving] = useState<Moving | null>(null);

  // While a seam is being dragged the preview tree is the truth on screen; the
  // URL only catches up on release.
  const live = preview ?? tree;
  const geometry = rects(live, FRAME);

  if (isNarrow) return <NarrowTiler panes={panes} />;

  const box = () => frameRef.current?.getBoundingClientRect() ?? null;

  function startResize(
    event: React.PointerEvent<HTMLElement>,
    divider: Divider,
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing({
      divider,
      origin: divider.dir === "h" ? event.clientX : event.clientY,
      base: live,
    });
  }

  function onResizeMove(event: React.PointerEvent<HTMLElement>) {
    if (!resizing) return;
    const rect = box();
    if (!rect) return;
    const { divider } = resizing;
    const horizontal = divider.dir === "h";
    const travelled =
      (horizontal ? event.clientX : event.clientY) - resizing.origin;
    const frameSize = horizontal ? rect.width : rect.height;
    // Pixels -> a share of the owning container, not of the whole screen: a
    // nested seam moves at the same speed under the finger as an outer one.
    const containerSpan =
      ((horizontal ? divider.container.w : divider.container.h) / 100) *
      frameSize;
    if (containerSpan <= 0) return;
    setPreview(
      resizeAt(
        resizing.base,
        divider.path,
        divider.index,
        travelled / containerSpan,
      ),
    );
  }

  function endResize() {
    if (!resizing) return;
    if (preview) commitResize(preview);
    setResizing(null);
    // Held until the router lands the new URL, or the panes would snap back to
    // the old shares for a frame.
    setTimeout(() => setPreview(null), 0);
  }

  function hitTest(clientX: number, clientY: number) {
    const rect = box();
    if (!rect) return null;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    for (const [view, r] of geometry) {
      if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) continue;
      const rx = (x - r.x) / r.w;
      const ry = (y - r.y) / r.h;
      const edge: Edge =
        rx > 0.3 && rx < 0.7 && ry > 0.3 && ry < 0.7
          ? "center"
          : Math.min(rx, 1 - rx) < Math.min(ry, 1 - ry)
            ? rx < 0.5
              ? "left"
              : "right"
            : ry < 0.5
              ? "top"
              : "bottom";
      return { view, edge };
    }
    return null;
  }

  function onMovePointerDown(
    event: React.PointerEvent<HTMLElement>,
    view: string,
  ) {
    if (geometry.size < 2) return; // nothing to move it next to
    const startX = event.clientX;
    const startY = event.clientY;
    const header = event.currentTarget;

    function onMove(move: PointerEvent) {
      const far =
        Math.hypot(move.clientX - startX, move.clientY - startY) >
        DRAG_THRESHOLD;
      if (!far) return;
      if (!header.hasPointerCapture(move.pointerId)) {
        header.setPointerCapture(move.pointerId);
      }
      const hit = hitTest(move.clientX, move.clientY);
      setMoving({
        view,
        target: hit && hit.view !== view ? hit.view : null,
        edge: hit && hit.view !== view ? hit.edge : null,
      });
    }

    function onUp(up: PointerEvent) {
      header.removeEventListener("pointermove", onMove);
      header.removeEventListener("pointerup", onUp);
      header.removeEventListener("pointercancel", onUp);
      const hit = hitTest(up.clientX, up.clientY);
      setMoving(null);
      if (hit && hit.view !== view) dropPane(view, hit.view, hit.edge);
    }

    header.addEventListener("pointermove", onMove);
    header.addEventListener("pointerup", onUp);
    header.addEventListener("pointercancel", onUp);
  }

  const dropRect = (() => {
    if (!moving?.target || !moving.edge) return null;
    const r = geometry.get(moving.target);
    if (!r) return null;
    if (moving.edge === "center") return r;
    const half = (n: number) => n / 2;
    if (moving.edge === "left") return { ...r, w: half(r.w) };
    if (moving.edge === "right")
      return { ...r, x: r.x + half(r.w), w: half(r.w) };
    if (moving.edge === "top") return { ...r, h: half(r.h) };
    return { ...r, y: r.y + half(r.h), h: half(r.h) };
  })();

  const settled = !resizing && !moving;

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative min-h-0 flex-1 p-[var(--pane-outer)]",
        !settled && "[&_*]:select-none",
      )}
    >
      {[...geometry].map(([view, r]) => (
        <div
          key={view}
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: `${r.w}%`,
            height: `${r.h}%`,
          }}
          className={cn(
            "absolute p-[var(--pane-gap-half)]",
            settled &&
              "transition-[left,top,width,height] duration-200 ease-out motion-reduce:transition-none",
            moving?.view === view && "opacity-40",
          )}
        >
          <Pane
            view={view}
            onHeaderPointerDown={(event) => onMovePointerDown(event, view)}
            draggable={geometry.size > 1}
          >
            {panes[view]}
          </Pane>
        </div>
      ))}

      {dividers(live, FRAME).map((divider) => (
        <Handle
          key={divider.id}
          divider={divider}
          active={resizing?.divider.id === divider.id}
          onPointerDown={(event) => startResize(event, divider)}
          onPointerMove={onResizeMove}
          onPointerUp={endResize}
        />
      ))}

      {dropRect && (
        <div
          aria-hidden
          style={{
            left: `${dropRect.x}%`,
            top: `${dropRect.y}%`,
            width: `${dropRect.w}%`,
            height: `${dropRect.h}%`,
          }}
          className="border-copper bg-copper/10 pointer-events-none absolute z-20 m-[var(--pane-gap-half)] border-2"
        />
      )}

      <span className="sr-only" aria-live="polite">
        {`${geometry.size} panes open, ${focus} focused`}
      </span>
    </div>
  );
}

/** The grab area is wider than the gutter it sits in — an 8px seam is a hard
 * target, so the handle reaches into both neighbours without looking like it. */
function Handle({
  divider,
  active,
  ...handlers
}: {
  divider: Divider;
  active: boolean;
} & Pick<
  React.ComponentProps<"div">,
  "onPointerDown" | "onPointerMove" | "onPointerUp"
>) {
  const horizontal = divider.dir === "h";
  return (
    <div
      role="separator"
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-label={horizontal ? "Resize columns" : "Resize rows"}
      {...handlers}
      onPointerCancel={handlers.onPointerUp}
      style={
        horizontal
          ? {
              left: `${divider.at}%`,
              top: `${divider.from}%`,
              height: `${divider.to - divider.from}%`,
            }
          : {
              top: `${divider.at}%`,
              left: `${divider.from}%`,
              width: `${divider.to - divider.from}%`,
            }
      }
      className={cn(
        "group absolute z-10 flex items-center justify-center",
        horizontal
          ? "w-4 -translate-x-1/2 cursor-col-resize"
          : "h-4 -translate-y-1/2 cursor-row-resize",
      )}
    >
      <span
        className={cn(
          "bg-copper block transition-opacity",
          horizontal ? "h-full w-0.5" : "h-0.5 w-full",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
        )}
      />
    </div>
  );
}

/* Below 768px the tree still exists — it just draws its focused leaf, full
 * bleed. Same components, same URLs, no second design. Resizing and dragging
 * need two panes on screen, so neither applies here. */
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

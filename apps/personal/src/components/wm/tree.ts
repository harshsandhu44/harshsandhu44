/* The tiling tree.
 *
 * n-ary containers rather than strict binary BSP: i3 works this way too, it
 * serialises to a far shorter URL, and it removes the degenerate re-nesting
 * cases binary splits produce when you close a pane.
 *
 * A view appears at most once in the tree. `about` is a place, not a document
 * you can have two copies of — opening it when it is already open focuses it.
 * That invariant is what lets a leaf's id just be its view name, which in turn
 * is what keeps the URL readable and the focused pane addressable by pathname.
 *
 * Directions follow the bar the keystroke draws:
 *   "h"  ⌘\  children left-to-right (a vertical bar between them)
 *   "v"  ⌘-  children top-to-bottom (a horizontal bar between them)
 */

export type Dir = "h" | "v";

export type Node =
  | { kind: "leaf"; view: string }
  | { kind: "container"; dir: Dir; children: Node[] };

export type Rect = { x: number; y: number; w: number; h: number };

export const leaf = (view: string): Node => ({ kind: "leaf", view });

export function views(node: Node): string[] {
  return node.kind === "leaf" ? [node.view] : node.children.flatMap(views);
}

export function has(node: Node, view: string): boolean {
  return views(node).includes(view);
}

// ── serialise ───────────────────────────────────────────────────────────────

export function serialize(node: Node): string {
  if (node.kind === "leaf") return node.view;
  return `${node.dir}(${node.children.map(serialize).join(",")})`;
}

/** Parses a layout string. Returns null on anything malformed — the URL is user
 * input, so a hand-mangled `?l=` must fall back to a default, never throw. */
export function parse(input: string): Node | null {
  let i = 0;

  function node(): Node | null {
    const start = i;
    while (i < input.length && /[a-z0-9/-]/.test(input[i]!)) i++;
    const token = input.slice(start, i);
    if (!token) return null;

    if (input[i] !== "(") return leaf(token);
    if (token !== "h" && token !== "v") return null;

    i++; // consume "("
    const children: Node[] = [];
    for (;;) {
      const child = node();
      if (!child) return null;
      children.push(child);
      if (input[i] === ",") {
        i++;
        continue;
      }
      break;
    }
    if (input[i] !== ")") return null;
    i++; // consume ")"
    if (children.length < 2) return null;
    return { kind: "container", dir: token, children };
  }

  const root = node();
  if (!root || i !== input.length) return null;

  const seen = views(root);
  if (new Set(seen).size !== seen.length) return null; // duplicate views
  return root;
}

// ── mutate ──────────────────────────────────────────────────────────────────

/** Inserts `view` beside `target`. If the parent already splits along `dir` the
 * new pane joins as a sibling; otherwise the target leaf is wrapped in a new
 * container. Returns the tree unchanged if `view` is already open. */
export function split(
  tree: Node,
  target: string,
  dir: Dir,
  view: string,
): Node {
  if (has(tree, view)) return tree;

  function walk(node: Node, parentDir: Dir | null): Node {
    if (node.kind === "leaf") {
      if (node.view !== target) return node;
      return parentDir === dir
        ? node // handled by the container below
        : { kind: "container", dir, children: [node, leaf(view)] };
    }
    if (node.dir === dir && node.children.some(isTargetLeaf)) {
      const at = node.children.findIndex(isTargetLeaf);
      const children = [...node.children];
      children.splice(at + 1, 0, leaf(view));
      return { ...node, children };
    }
    return { ...node, children: node.children.map((c) => walk(c, node.dir)) };
  }

  function isTargetLeaf(n: Node) {
    return n.kind === "leaf" && n.view === target;
  }

  return walk(tree, null);
}

/** Removes a pane. Containers left with one child collapse into it, so the tree
 * never accumulates single-child nodes. Returns null when `view` is the only
 * pane open — a window manager with no windows is a blank screen. */
export function close(tree: Node, view: string): Node | null {
  if (!has(tree, view)) return tree;
  if (tree.kind === "leaf") return null;

  function walk(node: Node): Node | null {
    if (node.kind === "leaf") return node.view === view ? null : node;
    const children = node.children
      .map(walk)
      .filter((c): c is Node => c !== null);
    if (children.length === 0) return null;
    if (children.length === 1) return children[0]!;
    return { ...node, children };
  }

  return walk(tree);
}

// ── geometry ────────────────────────────────────────────────────────────────

/** Equal splits. Drag-to-resize would add weights here; until then even shares
 * are the honest default and keep the URL free of magic numbers.
 * ponytail: no per-node ratio, add a weights array when resizing lands. */
export function rects(node: Node, frame: Rect): Map<string, Rect> {
  const out = new Map<string, Rect>();

  function walk(n: Node, r: Rect) {
    if (n.kind === "leaf") {
      out.set(n.view, r);
      return;
    }
    const count = n.children.length;
    n.children.forEach((child, idx) => {
      const share =
        n.dir === "h"
          ? { x: r.x + (r.w / count) * idx, y: r.y, w: r.w / count, h: r.h }
          : { x: r.x, y: r.y + (r.h / count) * idx, w: r.w, h: r.h / count };
      walk(child, share);
    });
  }

  walk(node, frame);
  return out;
}

const CENTRE = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** Directional focus, the way a tiling WM does it: among panes actually lying
 * in that direction, take the nearest centre. Falls back to null at the edge so
 * the caller can decide whether to wrap or stay put. */
export function focusDir(
  tree: Node,
  from: string,
  dir: "left" | "right" | "up" | "down",
  frame: Rect = { x: 0, y: 0, w: 1000, h: 1000 },
): string | null {
  const all = rects(tree, frame);
  const origin = all.get(from);
  if (!origin) return null;
  const o = CENTRE(origin);

  let best: { view: string; dist: number } | null = null;
  for (const [view, r] of all) {
    if (view === from) continue;
    const c = CENTRE(r);
    const inDirection =
      dir === "left"
        ? c.x < o.x
        : dir === "right"
          ? c.x > o.x
          : dir === "up"
            ? c.y < o.y
            : c.y > o.y;
    if (!inDirection) continue;
    // Weight the off-axis distance so a pane directly adjacent beats a nearer
    // one that is off to the side.
    const dx = c.x - o.x;
    const dy = c.y - o.y;
    const dist =
      dir === "left" || dir === "right"
        ? Math.abs(dx) + Math.abs(dy) * 2
        : Math.abs(dy) + Math.abs(dx) * 2;
    if (!best || dist < best.dist) best = { view, dist };
  }
  return best?.view ?? null;
}

/** Rotates the container that directly holds `view`. This is what ⌘\ and ⌘-
 * do: not "split", which needs a window to put there, but "lay this group out
 * the other way" — a real, visible operation with no hidden pending state. */
export function setDir(tree: Node, view: string, dir: Dir): Node {
  function walk(node: Node): Node {
    if (node.kind === "leaf") return node;
    const holdsTarget = node.children.some(
      (c) => c.kind === "leaf" && c.view === view,
    );
    if (holdsTarget) return { ...node, dir };
    return { ...node, children: node.children.map(walk) };
  }
  return walk(tree);
}

/** Direction a new pane should open in, given how the focused pane is shaped.
 * A wide pane splits into columns, a tall one into rows — the same instinct a
 * dynamic tiler applies, and it keeps panes near enough to readable. */
export function autoDir(tree: Node, focus: string, frame: Rect): Dir {
  const r = rects(tree, frame).get(focus);
  if (!r) return "h";
  return r.w >= r.h ? "h" : "v";
}

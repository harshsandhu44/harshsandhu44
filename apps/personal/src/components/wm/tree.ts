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

export type Container = {
  kind: "container";
  dir: Dir;
  children: Node[];
  /** Relative shares, one per child. Absent means even, which is both the
   * default and the common case — so an unresized layout serialises without
   * any numbers in it at all. */
  sizes?: number[];
};

export type Node = { kind: "leaf"; view: string } | Container;

export type Rect = { x: number; y: number; w: number; h: number };

/** Smallest share a pane can be dragged down to. Below this a pane is a sliver
 * with a header and no content, which is never what someone meant to do. */
export const MIN_SHARE = 0.08;

export const leaf = (view: string): Node => ({ kind: "leaf", view });

export function views(node: Node): string[] {
  return node.kind === "leaf" ? [node.view] : node.children.flatMap(views);
}

export function has(node: Node, view: string): boolean {
  return views(node).includes(view);
}

/** Normalised shares for a container's children. Always sums to 1, always the
 * right length, whatever state `sizes` is in — so callers never have to check. */
export function shares(node: Container): number[] {
  const count = node.children.length;
  const even = Array<number>(count).fill(1 / count);
  if (!node.sizes || node.sizes.length !== count) return even;
  const total = node.sizes.reduce((sum, size) => sum + size, 0);
  if (!(total > 0)) return even;
  return node.sizes.map((size) => size / total);
}

const isEven = (values: number[]) =>
  values.every((value) => Math.abs(value - 1 / values.length) < 0.0005);

// ── serialise ───────────────────────────────────────────────────────────────

const fmtShare = (fraction: number) => {
  const rounded = Math.round(fraction * 1000) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

export function serialize(node: Node): string {
  if (node.kind === "leaf") return node.view;
  const parts = shares(node);
  const children = node.children.map((child, index) =>
    isEven(parts)
      ? serialize(child)
      : `${serialize(child)}:${fmtShare(parts[index]!)}`,
  );
  return `${node.dir}(${children.join(",")})`;
}

/** Parses a layout string. Returns null on anything malformed — the URL is user
 * input, so a hand-mangled `?l=` must fall back to a default, never throw. */
export function parse(input: string): Node | null {
  let i = 0;

  function entry(): { node: Node; size?: number } | null {
    const start = i;
    while (i < input.length && /[a-z0-9/-]/.test(input[i]!)) i++;
    const token = input.slice(start, i);
    if (!token) return null;

    let node: Node;
    if (input[i] === "(") {
      if (token !== "h" && token !== "v") return null;
      i++; // consume "("
      const children: Node[] = [];
      const sizes: (number | undefined)[] = [];
      for (;;) {
        const child = entry();
        if (!child) return null;
        children.push(child.node);
        sizes.push(child.size);
        if (input[i] === ",") {
          i++;
          continue;
        }
        break;
      }
      if (input[i] !== ")") return null;
      i++; // consume ")"
      if (children.length < 2) return null;
      // Shares are all-or-nothing: a partially sized container has no sensible
      // reading, so treat it as malformed rather than guessing.
      const given = sizes.filter((size) => size !== undefined);
      if (given.length !== 0 && given.length !== children.length) return null;
      node =
        given.length === 0
          ? { kind: "container", dir: token, children }
          : { kind: "container", dir: token, children, sizes: given };
    } else {
      node = leaf(token);
    }

    if (input[i] !== ":") return { node };
    i++; // consume ":"
    const numStart = i;
    while (i < input.length && /[0-9.]/.test(input[i]!)) i++;
    const size = Number(input.slice(numStart, i));
    if (!Number.isFinite(size) || size <= 0) return null;
    return { node, size };
  }

  const root = entry();
  if (!root || i !== input.length) return null;

  const seen = views(root.node);
  if (new Set(seen).size !== seen.length) return null; // duplicate views
  return root.node;
}

// ── mutate ──────────────────────────────────────────────────────────────────

/** Inserts `view` beside `target`. If the parent already splits along `dir` the
 * new pane joins as a sibling, taking half of the target's share; otherwise the
 * target leaf is wrapped in a new container. Returns the tree unchanged if
 * `view` is already open. */
export function split(
  tree: Node,
  target: string,
  dir: Dir,
  view: string,
  before = false,
): Node {
  if (has(tree, view)) return tree;

  const isTargetLeaf = (node: Node) =>
    node.kind === "leaf" && node.view === target;

  function walk(node: Node, parentDir: Dir | null): Node {
    if (node.kind === "leaf") {
      if (node.view !== target) return node;
      if (parentDir === dir) return node; // the container below handles it
      return {
        kind: "container",
        dir,
        children: before ? [leaf(view), node] : [node, leaf(view)],
      };
    }
    if (node.dir === dir && node.children.some(isTargetLeaf)) {
      const at = node.children.findIndex(isTargetLeaf);
      const parts = shares(node);
      const children = [...node.children];
      children.splice(before ? at : at + 1, 0, leaf(view));
      // An untouched container stays even, so opening a fourth pane gives four
      // equal columns rather than two wide ones and two narrow. Only a
      // container someone has actually dragged subdivides the target's slot,
      // which is the one case where the existing proportions mean something.
      if (isEven(parts)) return { ...node, children, sizes: undefined };
      const half = parts[at]! / 2;
      const sizes = [...parts];
      sizes.splice(at, 1, half, half);
      return { ...node, children, sizes };
    }
    return { ...node, children: node.children.map((c) => walk(c, node.dir)) };
  }

  return walk(tree, null);
}

/** Removes a pane. Its share goes back to its siblings in proportion, and
 * containers left with one child collapse into it. Returns null when `view` is
 * the only pane open — a window manager with no windows is a blank screen. */
export function close(tree: Node, view: string): Node | null {
  if (!has(tree, view)) return tree;
  if (tree.kind === "leaf") return null;

  function walk(node: Node): Node | null {
    if (node.kind === "leaf") return node.view === view ? null : node;
    const parts = shares(node);
    const children: Node[] = [];
    const sizes: number[] = [];
    node.children.forEach((child, index) => {
      const next = walk(child);
      if (next) {
        children.push(next);
        sizes.push(parts[index]!);
      }
    });
    if (children.length === 0) return null;
    if (children.length === 1) return children[0]!;
    // shares() renormalises, so the survivors keep their relative proportions.
    return { ...node, children, sizes };
  }

  return walk(tree);
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

/** Exchanges two panes in place, keeping both slots' sizes. */
export function swap(tree: Node, a: string, b: string): Node {
  if (a === b || !has(tree, a) || !has(tree, b)) return tree;
  function walk(node: Node): Node {
    if (node.kind === "leaf") {
      if (node.view === a) return leaf(b);
      if (node.view === b) return leaf(a);
      return node;
    }
    return { ...node, children: node.children.map(walk) };
  }
  return walk(tree);
}

export type Edge = "center" | "left" | "right" | "top" | "bottom";

/** Drops `view` onto `target`. The centre swaps them; an edge pulls `view` out
 * of wherever it was and re-splits `target` along that edge. Both are just the
 * existing close/split pair, which is why dragging cannot produce a tree that
 * the URL could not already describe. */
export function moveTo(
  tree: Node,
  view: string,
  target: string,
  edge: Edge,
): Node {
  if (view === target || !has(tree, view) || !has(tree, target)) return tree;
  if (edge === "center") return swap(tree, view, target);

  const without = close(tree, view);
  if (!without || !has(without, target)) return tree;
  const dir: Dir = edge === "left" || edge === "right" ? "h" : "v";
  return split(without, target, dir, view, edge === "left" || edge === "top");
}

// ── geometry ────────────────────────────────────────────────────────────────

export function rects(node: Node, frame: Rect): Map<string, Rect> {
  const out = new Map<string, Rect>();

  function walk(n: Node, r: Rect) {
    if (n.kind === "leaf") {
      out.set(n.view, r);
      return;
    }
    const parts = shares(n);
    let offset = 0;
    n.children.forEach((child, index) => {
      const fraction = parts[index]!;
      const slot =
        n.dir === "h"
          ? { x: r.x + r.w * offset, y: r.y, w: r.w * fraction, h: r.h }
          : { x: r.x, y: r.y + r.h * offset, w: r.w, h: r.h * fraction };
      offset += fraction;
      walk(child, slot);
    });
  }

  walk(node, frame);
  return out;
}

export type Divider = {
  /** Stable across renders so React can keep the handle's DOM node mid-drag. */
  id: string;
  /** Child indices from the root down to the container that owns this seam. */
  path: number[];
  /** The seam sits between children[index] and children[index + 1]. */
  index: number;
  dir: Dir;
  /** Position along the split axis, in frame units. */
  at: number;
  /** Extent across the other axis, in frame units. */
  from: number;
  to: number;
  /** The owning container's rect, so a drag in pixels can be converted into a
   * share of the right box rather than of the whole screen. */
  container: Rect;
};

/** Every seam between two panes. These are the grab handles for resizing. */
export function dividers(node: Node, frame: Rect): Divider[] {
  const out: Divider[] = [];

  function walk(n: Node, r: Rect, path: number[]) {
    if (n.kind === "leaf") return;
    const parts = shares(n);
    let offset = 0;
    n.children.forEach((child, index) => {
      const fraction = parts[index]!;
      const slot =
        n.dir === "h"
          ? { x: r.x + r.w * offset, y: r.y, w: r.w * fraction, h: r.h }
          : { x: r.x, y: r.y + r.h * offset, w: r.w, h: r.h * fraction };
      offset += fraction;
      if (index < n.children.length - 1) {
        out.push({
          id: `${path.join(".")}|${index}`,
          path: [...path],
          index,
          dir: n.dir,
          at: n.dir === "h" ? slot.x + slot.w : slot.y + slot.h,
          from: n.dir === "h" ? r.y : r.x,
          to: n.dir === "h" ? r.y + r.h : r.x + r.w,
          container: r,
        });
      }
      walk(child, slot, [...path, index]);
    });
  }

  walk(node, frame, []);
  return out;
}

/** Moves one seam by `delta`, expressed as a fraction of its own container.
 * Both neighbours are clamped at MIN_SHARE, so a drag can never collapse a pane
 * out of existence — closing is a separate, deliberate action. */
export function resizeAt(
  tree: Node,
  path: number[],
  index: number,
  delta: number,
): Node {
  function walk(node: Node, depth: number): Node {
    if (node.kind === "leaf") return node;
    if (depth === path.length) {
      const parts = shares(node);
      const a = parts[index];
      const b = parts[index + 1];
      if (a === undefined || b === undefined) return node;
      const clamped = Math.max(
        -(a - MIN_SHARE),
        Math.min(delta, b - MIN_SHARE),
      );
      const sizes = [...parts];
      sizes[index] = a + clamped;
      sizes[index + 1] = b - clamped;
      return { ...node, sizes };
    }
    const at = path[depth]!;
    return {
      ...node,
      children: node.children.map((child, i) =>
        i === at ? walk(child, depth + 1) : child,
      ),
    };
  }
  return walk(tree, 0);
}

/** The seam a keyboard resize should move: the one on the given side of the
 * focused pane, so ⌥l widens the pane you are looking at. */
export function seamFor(
  tree: Node,
  view: string,
  dir: "left" | "right" | "up" | "down",
  frame: Rect,
): { divider: Divider; sign: number } | null {
  const rect = rects(tree, frame).get(view);
  if (!rect) return null;
  const wantVertical = dir === "left" || dir === "right";
  const edge =
    dir === "left"
      ? rect.x
      : dir === "right"
        ? rect.x + rect.w
        : dir === "up"
          ? rect.y
          : rect.y + rect.h;

  for (const divider of dividers(tree, frame)) {
    if ((divider.dir === "h") !== wantVertical) continue;
    if (Math.abs(divider.at - edge) > 0.001) continue;
    // Pushing the seam on your left edge leftwards grows this pane, which means
    // a negative delta there and a positive one on the right.
    const sign = dir === "left" || dir === "up" ? -1 : 1;
    return { divider, sign };
  }
  return null;
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

/** Direction a new pane should open in, given how the focused pane is shaped.
 * A wide pane splits into columns, a tall one into rows — the same instinct a
 * dynamic tiler applies, and it keeps panes near enough to readable. */
export function autoDir(tree: Node, focus: string, frame: Rect): Dir {
  const r = rects(tree, frame).get(focus);
  if (!r) return "h";
  return r.w >= r.h ? "h" : "v";
}

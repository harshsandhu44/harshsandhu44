"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  type Dir,
  type Edge,
  type Node,
  autoDir,
  close as closeNode,
  focusDir,
  moveTo,
  rects,
  resizeAt,
  seamFor,
  setDir,
  split,
  swap,
} from "./tree";
import { STORAGE_KEY, wmHref } from "./views";

type Direction = "left" | "right" | "up" | "down";

type Wm = {
  tree: Node;
  focus: string;
  isNarrow: boolean;
  open: (view: string) => void;
  focusPane: (view: string) => void;
  closePane: (view?: string) => void;
  rotate: (dir: Dir) => void;
  move: (dir: Direction) => void;
  /** Commits a dragged seam. Replaces rather than pushes: a resize is a tweak
   * to the current arrangement, not a new one, and fifty history entries per
   * drag would make the back button useless. */
  commitResize: (tree: Node) => void;
  /** Nudges the seam on one side of the focused pane, for ⌥ + direction. */
  resizeFocused: (dir: Direction, step?: number) => void;
  /** Drops the dragged pane onto a target: centre swaps, an edge re-splits. */
  dropPane: (view: string, target: string, edge: Edge) => void;
  /** Sends the focused pane at its neighbour, for ⇧ + direction. */
  movePane: (dir: Direction) => void;
};

const WmContext = createContext<Wm | null>(null);

export function useWm() {
  const wm = use(WmContext);
  if (!wm) throw new Error("useWm outside WmProvider");
  return wm;
}

/* The URL is the single source of truth for the layout: the server parses `?l=`
 * and hands the tree down as a prop, and every action is a push. That is why
 * back/forward move through arrangements, why a link restores one exactly, and
 * why there is no client tree state to drift out of sync with the panes the
 * server rendered. */
export function WmProvider({
  tree,
  focus,
  children,
}: {
  tree: Node;
  focus: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isNarrow = useMediaQuery("(max-width: 767px)");

  const frame = useMemo(() => ({ x: 0, y: 0, w: 100, h: 100 }), []);

  const go = useCallback(
    (nextFocus: string, nextTree: Node) => {
      router.push(wmHref(nextFocus, nextTree), { scroll: false });
    },
    [router],
  );

  const replace = useCallback(
    (nextFocus: string, nextTree: Node) => {
      router.replace(wmHref(nextFocus, nextTree), { scroll: false });
    },
    [router],
  );

  const open = useCallback(
    (view: string) => {
      if (view === focus) return;
      const already = rects(tree, frame).has(view);
      if (already) return go(view, tree);
      // On a phone there is nothing to tile into, so opening replaces.
      if (isNarrow) return router.push(`/${view}`, { scroll: false });
      go(view, split(tree, focus, autoDir(tree, focus, frame), view));
    },
    [focus, frame, go, isNarrow, router, tree],
  );

  const focusPane = useCallback(
    (view: string) => {
      if (view !== focus) go(view, tree);
    },
    [focus, go, tree],
  );

  const closePane = useCallback(
    (view = focus) => {
      const next = closeNode(tree, view);
      if (!next) return; // never leave an empty desktop
      const stillFocused = rects(next, frame).has(focus);
      go(stillFocused ? focus : rects(next, frame).keys().next().value!, next);
    },
    [focus, frame, go, tree],
  );

  const rotate = useCallback(
    (dir: Dir) => go(focus, setDir(tree, focus, dir)),
    [focus, go, tree],
  );

  const move = useCallback(
    (dir: Direction) => {
      const next = focusDir(tree, focus, dir, frame);
      if (next) go(next, tree);
    },
    [focus, frame, go, tree],
  );

  const commitResize = useCallback(
    (next: Node) => replace(focus, next),
    [focus, replace],
  );

  const resizeFocused = useCallback(
    (dir: Direction, step = 0.05) => {
      const seam = seamFor(tree, focus, dir, frame);
      if (!seam) return;
      const next = resizeAt(
        tree,
        seam.divider.path,
        seam.divider.index,
        seam.sign * step,
      );
      replace(focus, next);
    },
    [focus, frame, replace, tree],
  );

  const dropPane = useCallback(
    (view: string, target: string, edge: Edge) => {
      const next = moveTo(tree, view, target, edge);
      if (next === tree) return;
      go(view, next);
    },
    [go, tree],
  );

  const movePane = useCallback(
    (dir: Direction) => {
      const neighbour = focusDir(tree, focus, dir, frame);
      if (!neighbour) return;
      go(focus, swap(tree, focus, neighbour));
    },
    [focus, frame, go, tree],
  );

  const wm = useMemo<Wm>(
    () => ({
      tree,
      focus,
      isNarrow,
      open,
      focusPane,
      closePane,
      rotate,
      move,
      commitResize,
      resizeFocused,
      dropPane,
      movePane,
    }),
    [
      tree,
      focus,
      isNarrow,
      open,
      focusPane,
      closePane,
      rotate,
      move,
      commitResize,
      resizeFocused,
      dropPane,
      movePane,
    ],
  );

  useKeymap(wm);
  usePersistedLayout(tree, focus);

  return <WmContext value={wm}>{children}</WmContext>;
}

/* ── keyboard ──────────────────────────────────────────────────────────────
 * The keyboard is the point of this interface, but never the only way in: every
 * binding here has a click target somewhere in the chrome. */
function useKeymap(wm: Wm) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isTyping(event.target)) return;

      const meta = event.metaKey || event.ctrlKey;

      // ⌥ + direction resizes. Matched on `code` because on macOS ⌥h produces
      // "˙" rather than "h", so `key` is useless for alt bindings.
      if (event.altKey && !meta) {
        const direction = CODE_DIRECTIONS[event.code];
        if (!direction) return;
        event.preventDefault();
        return wm.resizeFocused(direction);
      }

      if (meta && event.key === "\\") {
        event.preventDefault();
        return wm.rotate("h");
      }
      if (meta && event.key === "-") {
        event.preventDefault();
        return wm.rotate("v");
      }
      if (meta && (event.key === "w" || event.key === "W")) {
        event.preventDefault();
        return wm.closePane();
      }
      if (meta) return; // leave every other browser shortcut alone

      const direction = DIRECTIONS[event.key];
      if (!direction) return;
      event.preventDefault();
      // ⇧ + direction takes the pane with you; plain direction just looks.
      return event.shiftKey ? wm.movePane(direction) : wm.move(direction);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wm]);
}

const DIRECTIONS: Record<string, Direction> = {
  h: "left",
  j: "down",
  k: "up",
  l: "right",
  H: "left",
  J: "down",
  K: "up",
  L: "right",
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowUp: "up",
  ArrowRight: "right",
};

const CODE_DIRECTIONS: Record<string, Direction> = {
  KeyH: "left",
  KeyJ: "down",
  KeyK: "up",
  KeyL: "right",
  ArrowLeft: "left",
  ArrowDown: "down",
  ArrowUp: "up",
  ArrowRight: "right",
};

export function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA"
  );
}

/* ── persistence ───────────────────────────────────────────────────────────
 * Saved on every change, read only by the entry point at `/`. Restoring is what
 * makes it feel like a machine you left running rather than a page. */
function usePersistedLayout(tree: Node, focus: string) {
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, wmHref(focus, tree));
    } catch {
      // Private browsing, blocked storage — the URL still works.
    }
  }, [tree, focus]);
}

export function readPersistedLayout() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/* ── media query ───────────────────────────────────────────────────────────*/
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        const mql = window.matchMedia(query);
        mql.addEventListener("change", notify);
        return () => mql.removeEventListener("change", notify);
      },
      [query],
    ),
    () => window.matchMedia(query).matches,
    () => false, // server: assume desktop, the narrow case is a CSS override too
  );
}

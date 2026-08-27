import { type Node, parse, serialize, leaf } from "./tree";

/** The bar's numbered sections. The number is not decoration — it is the key
 * that opens the section, so it carries real information. */
export const SECTIONS = [
  { n: 1, view: "about", label: "about" },
  { n: 2, view: "work", label: "work" },
  { n: 3, view: "resume", label: "resume" },
  { n: 4, view: "contact", label: "contact" },
] as const;

/** Two panes on arrival: the metaphor explains itself before anyone reads a
 * word, and the résumé is visible without a click. */
export const DEFAULT_LAYOUT = "h(about,resume)";
export const DEFAULT_FOCUS = "about";

export const STORAGE_KEY = "hs.wm";

/** A view id is its path without the leading slash, so the two convert by
 * trimming. Keeping them the same string is what lets the pathname name the
 * focused pane. */
export const viewToPath = (view: string) => `/${view}`;
export const pathToView = (pathname: string) =>
  pathname === "/" ? DEFAULT_FOCUS : pathname.replace(/^\/+|\/+$/g, "");

export function paneTitle(view: string) {
  return `~/${view}`;
}

/** The URL for a given focus and layout. The `l` param is omitted whenever the
 * layout is a single pane, so the common case stays a clean shareable path. */
export function wmHref(focus: string, tree: Node) {
  const path = viewToPath(focus);
  return tree.kind === "leaf" ? path : `${path}?l=${serialize(tree)}`;
}

/** Resolves the tree the server should render for a request. Anything
 * unparseable, or a layout that does not contain the focused view, falls back
 * rather than erroring — `?l=` is user input. */
export function resolveTree(
  focus: string,
  layoutParam: string | undefined,
  fallback = DEFAULT_LAYOUT,
): Node {
  const parsed = layoutParam ? parse(layoutParam) : parse(fallback);
  if (parsed && parsed.kind !== "leaf") {
    if (parse(serialize(parsed)) && containsView(parsed, focus)) return parsed;
  }
  if (parsed && parsed.kind === "leaf" && parsed.view === focus) return parsed;
  return leaf(focus);
}

function containsView(node: Node, view: string): boolean {
  return node.kind === "leaf"
    ? node.view === view
    : node.children.some((c) => containsView(c, view));
}

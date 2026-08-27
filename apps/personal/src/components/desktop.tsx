import { buildVfs } from "#lib/vfs";
import { AboutPane } from "./panes/about";
import { ResumePane } from "./panes/resume";
import { WorkPane } from "./panes/work";
import { ContactPane } from "./panes/contact";
import { DesktopShell } from "./desktop-shell";
import { rects } from "./wm/tree";
import { WmProvider } from "./wm/provider";
import { DEFAULT_FOCUS, DEFAULT_LAYOUT, resolveTree } from "./wm/views";

export { DEFAULT_FOCUS, DEFAULT_LAYOUT };

const PANES: Record<string, () => React.ReactNode> = {
  about: AboutPane,
  resume: ResumePane,
  work: WorkPane,
  contact: ContactPane,
};

/* Server renders what is in the panes; the client decides where they go. Every
 * pane in the requested layout is rendered here, on the server, which is why a
 * crawler or a link preview sees the whole arrangement as real HTML. */
export async function Desktop({
  view,
  layout,
  defaultLayout,
  isEntry = false,
}: {
  view: string;
  layout?: string;
  /** Layout to use when the URL carries none. The entry point opens two panes
   * so the interface explains itself; a deep link to one section opens just
   * that section, because that is what the person sharing it meant. */
  defaultLayout?: string;
  isEntry?: boolean;
}) {
  const tree = resolveTree(view, layout, defaultLayout ?? view);
  const open = [...rects(tree, { x: 0, y: 0, w: 100, h: 100 }).keys()];

  const panes: Record<string, React.ReactNode> = {};
  for (const name of open) {
    const Pane = PANES[name];
    if (Pane) panes[name] = <Pane key={name} />;
  }

  const vfs = await buildVfs();

  return (
    <WmProvider tree={tree} focus={view}>
      <DesktopShell panes={panes} vfs={vfs} isEntry={isEntry} />
    </WmProvider>
  );
}

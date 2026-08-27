"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Vfs } from "#lib/vfs";
import { usePersistedFlag } from "#lib/persisted";
import { Bar } from "./chrome/bar";
import { Boot } from "./chrome/boot";
import { Crt } from "./chrome/crt";
import { Terminal } from "./shell/terminal";
import { Tiler } from "./wm/tiler";
import { isTyping, readPersistedLayout } from "./wm/provider";

const CRT_KEY = "hs.crt";

export function DesktopShell({
  panes,
  vfs,
  isEntry,
}: {
  panes: Record<string, React.ReactNode>;
  vfs: Vfs;
  isEntry: boolean;
}) {
  const router = useRouter();
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [crt, setCrt] = usePersistedFlag(CRT_KEY, true);

  // Only the entry point restores a saved arrangement. Any other URL was asked
  // for explicitly — by a link, a bookmark or the back button — and wins.
  useEffect(() => {
    if (!isEntry) return;
    const saved = readPersistedLayout();
    if (saved && saved !== "/about") router.replace(saved, { scroll: false });
  }, [isEntry, router]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "`" || event.metaKey || event.ctrlKey) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      setTerminalOpen((open) => !open);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Boot />
      <Crt on={crt} />
      <div className="flex h-full min-h-0 flex-col">
        <Bar onToggleTerminal={() => setTerminalOpen((open) => !open)} />
        <Tiler panes={panes} />
        <Terminal
          vfs={vfs}
          open={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          crt={crt}
          setCrt={setCrt}
        />
      </div>
    </>
  );
}

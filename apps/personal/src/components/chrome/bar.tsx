"use client";

import { cn } from "@harshsandhu44/ui/lib/utils";
import { rects } from "../wm/tree";
import { useWm } from "../wm/provider";
import { SECTIONS } from "../wm/views";
import { Clock } from "./clock";

const FRAME = { x: 0, y: 0, w: 100, h: 100 };

/* Three states, three meanings: gold is focused, silkscreen is open but not
 * focused, dim is closed. The numeral is the key that opens it, so it earns its
 * place — this is a keymap, not a decorative index. */
export function Bar({ onToggleTerminal }: { onToggleTerminal: () => void }) {
  const { tree, focus, open } = useWm();
  const openViews = rects(tree, FRAME);

  return (
    <header className="border-rule bg-surface-2 flex shrink-0 items-center justify-between gap-4 border-b px-3 py-1.5">
      <nav aria-label="Sections" className="flex items-center gap-1">
        {SECTIONS.map((section) => {
          const isFocused = section.view === focus;
          const isOpen = openViews.has(section.view);
          return (
            <button
              key={section.view}
              type="button"
              onClick={() => open(section.view)}
              aria-current={isFocused ? "page" : undefined}
              className={cn(
                "px-2 py-0.5 font-mono text-xs transition-colors",
                isFocused
                  ? "text-gold"
                  : isOpen
                    ? "text-silkscreen"
                    : "text-silk-dim hover:text-silkscreen",
              )}
            >
              <span className="tabular-nums">{section.n}</span>
              <span className="text-silk-dim">:</span>
              {section.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleTerminal}
          className="text-silk-dim hover:text-silkscreen font-mono text-xs transition-colors"
        >
          <span aria-hidden>`</span>
          <span className="sr-only">Toggle </span> terminal
        </button>
        <Clock />
      </div>
    </header>
  );
}

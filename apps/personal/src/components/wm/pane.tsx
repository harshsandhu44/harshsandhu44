"use client";

import { cn } from "@harshsandhu44/ui/lib/utils";
import { useWm } from "./provider";
import { paneTitle } from "./views";

/* The copper rule sits under exactly one pane header — the focused one. It is
 * the only copper on screen, which is what makes it readable at a glance. */
export function Pane({
  view,
  children,
}: {
  view: string;
  children: React.ReactNode;
}) {
  const { focus, focusPane, closePane, tree } = useWm();
  const isFocused = view === focus;
  const canClose = tree.kind !== "leaf";

  return (
    <section
      aria-label={paneTitle(view)}
      onMouseDown={() => focusPane(view)}
      className={cn(
        "border-rule bg-surface flex h-full flex-col overflow-hidden border",
        isFocused ? "border-rule" : "border-rule/60",
      )}
    >
      <header
        className={cn(
          "bg-surface-2 flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5",
          isFocused ? "border-copper" : "border-rule",
        )}
      >
        <button
          type="button"
          onClick={() => focusPane(view)}
          className={cn(
            "label truncate transition-colors",
            isFocused ? "text-silkscreen" : "text-silk-dim",
          )}
        >
          {paneTitle(view)}
        </button>
        {canClose && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closePane(view);
            }}
            aria-label={`Close ${paneTitle(view)}`}
            className="text-silk-dim hover:text-flux shrink-0 px-1 font-mono text-xs leading-none transition-colors"
          >
            ×
          </button>
        )}
      </header>
      <div className="pane-scroll min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </section>
  );
}

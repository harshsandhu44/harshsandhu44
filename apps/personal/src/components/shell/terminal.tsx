"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@harshsandhu44/ui/lib/utils";
import type { Vfs } from "#lib/vfs";
import { useWm } from "../wm/provider";
import { type Line, complete, runCommand } from "./commands";

const GREETING: Line[] = [
  { text: "harshsandhu.com — tiling shell", tone: "dim" },
  { text: "type `help`, or press ` to put this away", tone: "dim" },
];

export function Terminal({
  vfs,
  open: isOpen,
  onClose,
  crt,
  setCrt,
}: {
  vfs: Vfs;
  open: boolean;
  onClose: () => void;
  crt: boolean;
  setCrt: (on: boolean) => void;
}) {
  const wm = useWm();
  const [lines, setLines] = useState<Line[]>(GREETING);
  const [cwd, setCwd] = useState("/");
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, isOpen]);

  const env = {
    vfs,
    cwd,
    setCwd,
    open: wm.open,
    closePane: wm.closePane,
    move: wm.move,
    movePane: wm.movePane,
    resizeFocused: wm.resizeFocused,
    rotate: wm.rotate,
    clear: () => setLines([]),
    crt,
    setCrt,
  };

  function submit() {
    const input = value;
    setValue("");
    setCursor(-1);
    if (input.trim()) setHistory((h) => [input, ...h]);
    const echo: Line = { text: `${prompt(cwd)} ${input}`, tone: "accent" };
    const output = input.trim() ? runCommand(input, env) : [];
    // `clear` empties the log itself; anything appended after would defeat it.
    if (input.trim().split(/\s+/)[0] === "clear") return;
    setLines((current) => [...current, echo, ...output]);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      return submit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      return onClose();
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const matches = complete(value, env);
      if (matches.length === 1) {
        const parts = value.split(/\s+/);
        parts[parts.length - 1] = matches[0]!;
        setValue(parts.join(" "));
      } else if (matches.length > 1) {
        setLines((c) => [
          ...c,
          { text: `${prompt(cwd)} ${value}`, tone: "accent" },
          { text: matches.join("   ") },
        ]);
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(cursor + 1, history.length - 1);
      if (next >= 0) {
        setCursor(next);
        setValue(history[next]!);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = cursor - 1;
      setCursor(next);
      setValue(next >= 0 ? history[next]! : "");
      return;
    }
    if (event.key === "c" && event.ctrlKey) {
      event.preventDefault();
      setLines((c) => [
        ...c,
        { text: `${prompt(cwd)} ${value}^C`, tone: "dim" },
      ]);
      setValue("");
      return;
    }
    if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  }

  return (
    <div
      role="region"
      aria-label="Terminal"
      className={cn(
        "border-rule bg-surface shrink-0 border-t transition-[height] duration-200 ease-out motion-reduce:transition-none",
        isOpen ? "h-64 sm:h-72" : "h-0 overflow-hidden border-t-0",
      )}
    >
      <div
        ref={logRef}
        className="pane-scroll h-[calc(100%-2rem)] overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line, index) => (
          <pre
            key={index}
            className={cn(
              "whitespace-pre-wrap",
              line.tone === "dim" && "text-silk-dim",
              line.tone === "error" && "text-flux",
              line.tone === "accent" && "text-copper",
              !line.tone && "text-silkscreen",
            )}
          >
            {line.text || " "}
          </pre>
        ))}
      </div>
      <div className="flex h-8 items-center gap-2 px-3 font-mono text-xs">
        <label htmlFor="shell" className="text-copper shrink-0">
          {prompt(cwd)}
        </label>
        <input
          id="shell"
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Shell input"
          className="text-silkscreen caret-copper min-w-0 flex-1 bg-transparent outline-none"
        />
      </div>
    </div>
  );
}

const prompt = (cwd: string) => `~${cwd === "/" ? "" : cwd} $`;

"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "intro" | "arming" | "go" | "jump" | "slow" | "result";

const now = () => performance.now();
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// Like F1: reds come on a second apart, then all go out together after an unannounced pause.
// The load intro uses faster steps so it doesn't hold up the page. ponytail: the FIA doesn't
// publish the pause range; 0.2–3 s is the commonly quoted one.
const STEP = 1000;
const INTRO_STEP = 380;
const pause = () => 200 + Math.random() * 2800;

// F1 start lights between the two halves of the name. On load they run once as an intro; a tap
// starts a reaction test.
export function Gantry() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lit, setLit] = useState(0);
  const [ms, setMs] = useState(0);
  const [best, setBest] = useState(0);
  const timers = useRef<number[]>([]);
  const goAt = useRef(0);

  const later = (fn: () => void, t: number) => timers.current.push(window.setTimeout(fn, t));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const buzz = (pattern: number | number[]) => {
    if (!reduced()) navigator.vibrate?.(pattern);
  };

  useEffect(() => {
    const t = timers.current;
    t.push(window.setTimeout(() => setPhase("intro"), 900));
    for (let n = 1; n <= 5; n++) t.push(window.setTimeout(() => setLit(n), 900 + n * INTRO_STEP));
    t.push(
      window.setTimeout(
        () => {
          setPhase("idle");
          setLit(0);
        },
        900 + 5 * INTRO_STEP + pause(),
      ),
    );
    return () => t.forEach(clearTimeout);
  }, []);

  const start = () => {
    clear();
    setPhase("arming");
    setLit(0);
    for (let n = 1; n <= 5; n++)
      later(() => {
        setLit(n);
        buzz(35);
      }, n * STEP);
    const out = 5 * STEP + pause();
    later(() => {
      goAt.current = now();
      setPhase("go");
      setLit(0);
    }, out);
    later(() => setPhase((p) => (p === "go" ? "slow" : p)), out + 3000);
  };

  const tap = () => {
    if (phase === "arming") {
      clear();
      buzz([60, 60, 60]);
      setPhase("jump");
      setLit(0);
    } else if (phase === "go") {
      const t = Math.round(now() - goAt.current);
      clear();
      setMs(t);
      setBest((b) => (b ? Math.min(b, t) : t));
      setPhase("result");
    } else start();
  };

  const caption = {
    idle: "Tap the lights. Go when they go out.",
    intro: "Lights out and away we go.",
    arming: "Wait for it.",
    go: "Now.",
    jump: "Jump start. Tap to line up again.",
    slow: "They went out a while ago. Tap to retry.",
    result: `${(ms / 1000).toFixed(3)} s. Best ${(best / 1000).toFixed(3)} s. Tap to go again.`,
  }[phase];
  const armed = phase === "arming" || phase === "go";

  return (
    <div className="relative my-[.06em] flex flex-col items-center self-stretch md:my-0 md:self-auto">
      <span data-gantry className="block w-full md:w-auto">
        <button
          type="button"
          onClick={tap}
          aria-label={armed ? "Tap when the lights go out" : "Start the lights for a reaction test"}
          className="flex h-[.64em] w-full touch-manipulation items-center justify-between rounded-[.09em] bg-pit px-[.16em] text-[1em] shadow-[inset_0_0_0_2px_var(--color-lamp)] transition-transform duration-250 ease-soft [-webkit-tap-highlight-color:transparent] active:scale-[.97] md:mt-[.06em] md:h-[.6em] md:w-[1.9em] md:rounded-[.07em] md:px-[.12em] md:hover:-translate-y-[.025em]"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`size-[.4em] rounded-full transition-colors duration-[60ms] ease-linear md:size-[.27em] ${i < lit ? "bg-accent" : "bg-lamp"}`}
            />
          ))}
        </button>
      </span>
      {/* The design inherits the display face's italic 800 here; set back to body text. */}
      <span
        aria-live="polite"
        className="mt-2.5 text-center font-sans text-[15px] leading-[1.4] font-normal tracking-normal text-soft not-italic tabular-nums [font-stretch:100%] short:mt-2 short:text-sm md:absolute md:top-[calc(100%+20px)] md:left-1/2 md:mt-0 md:-translate-x-1/2 md:text-base md:whitespace-nowrap"
      >
        {caption}
      </span>
    </div>
  );
}

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { bind, play, setEnabled, setTheme, setVolume, unlock } from "cuelume";

// UI sounds, on unless turned off. Cuelume stays silent until the page's first click anyway.
const KEY = "sound";
// ponytail: in-memory stand-in for when storage is blocked; the choice lasts for the page only.
let fallback = true;
const isOn = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return fallback;
  }
};
const subs = new Set<() => void>();
const subscribe = (fn: () => void) => {
  subs.add(fn);
  return () => void subs.delete(fn);
};

// Mounted once in the root layout: wires every data-cuelume-* attribute on the page.
export function Sound() {
  useEffect(() => {
    setTheme("mech");
    setVolume(0.5);
    setEnabled(isOn());
    return bind();
  }, []);
  return null;
}

export function SoundToggle({ className = "" }) {
  const on = useSyncExternalStore(subscribe, isOn, () => true);
  const toggle = () => {
    fallback = !on;
    try {
      localStorage.setItem(KEY, on ? "off" : "on");
    } catch {
      // Blocked storage: `fallback` holds the choice.
    }
    setEnabled(!on);
    if (!on) {
      void unlock();
      play("toggle");
    }
    subs.forEach((fn) => fn());
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={on} className={className}>
      Sound {on ? "on" : "off"}
    </button>
  );
}

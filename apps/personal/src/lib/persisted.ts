"use client";

import { useCallback, useSyncExternalStore } from "react";

/* Browser storage is an external store, so it is read through the hook designed
 * for external stores rather than a mount effect: no cascading render, and no
 * hydration mismatch because the server snapshot is explicit. Every access is
 * guarded — private windows and blocked site data throw rather than return
 * null. */

const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, notify: () => void) {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    set.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

export function readFlag(key: string, fallback: boolean) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw === "on";
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "on" : "off");
  } catch {
    // Preference just won't survive the tab.
  }
  listeners.get(key)?.forEach((notify) => notify());
}

export function usePersistedFlag(key: string, fallback: boolean) {
  const value = useSyncExternalStore(
    useCallback((notify: () => void) => subscribe(key, notify), [key]),
    () => readFlag(key, fallback),
    () => fallback,
  );
  const set = useCallback((next: boolean) => writeFlag(key, next), [key]);
  return [value, set] as const;
}

/** True only the first time in a tab session, and never when the visitor has
 * asked for reduced motion. Used to decide whether the boot sequence plays. */
export function useFirstVisitThisSession(key: string) {
  return useSyncExternalStore(
    () => () => {},
    () => {
      try {
        if (sessionStorage.getItem(key) === "1") return false;
      } catch {
        // Blocked storage: treat as first visit, the sequence is 1s and skippable.
      }
      return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
    () => false, // server renders no boot overlay at all
  );
}

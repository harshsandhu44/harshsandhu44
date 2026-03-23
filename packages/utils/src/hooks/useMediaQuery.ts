"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => {
    return false; // Return false or a specific default for SSR
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

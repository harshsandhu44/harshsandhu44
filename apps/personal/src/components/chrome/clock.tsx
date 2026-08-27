"use client";

import { useEffect, useState } from "react";

/* Rendered empty on the server and filled after mount: a clock is the one thing
 * on a page that is guaranteed to disagree between server and client. */
export function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        }).format(new Date()),
      );
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-silk-dim font-mono text-xs tabular-nums">
      {time && `${time} IST`}
    </span>
  );
}

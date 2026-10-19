"use client";

import dynamic from "next/dynamic";

// Client-only: the drive reads your picks from localStorage as it first renders.
const Drive = dynamic(() => import("@/components/drive"), { ssr: false });

export default function Page() {
  return <Drive />;
}

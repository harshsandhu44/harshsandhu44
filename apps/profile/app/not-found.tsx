"use client";

import Link from "next/link";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WordRotate } from "@/components/ui/word-rotate";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const path = usePathname();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4 font-mono selection:bg-primary/30">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border bg-card/50 shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 border-b bg-card px-4 py-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center text-xs text-muted-foreground">
            Harsh@MacBook-Pro: ~ (zsh)
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 space-y-4 text-sm md:text-base">
          <div className="flex gap-2">
            <span className="text-green-500">➜</span>
            <span className="text-blue-500">~</span>
            <span>
              curl https://harshsandhu.com
              {path}
            </span>
          </div>

          <div className="space-y-1 text-destructive">
            <p>Error: 404_PAGE_NOT_FOUND</p>
            <p>Status: CRITICAL_FAILURE</p>
            <p>Telemetry: OFF_TRACK_LIMITS_TURN_1</p>
          </div>

          <div className="border-l-2 pl-4 py-2 text-muted-foreground">
            <span className="text-muted-foreground">Analysis:</span>
            <span className="ml-2">The page you are looking for has been</span>
            <WordRotate
              className="inline-block px-1 font-bold text-warning"
              words={[
                "deleted by `rm -rf /`",
                "retired from the race (DNF)",
                "lost in the Docker build context",
                "garbage collected",
                "pitted for soft tires",
              ]}
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <p className="text-muted-foreground/75 text-xs sm:text-sm">
              [System]: Initiating recovery protocol...
            </p>

            <Button asChild variant="outline" className="group">
              <Link href="/">
                <Terminal className="mr-2 size-4" />
                <span className="group-hover:hidden">cd ..</span>
                <span className="hidden group-hover:inline">cd /</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed -z-10 h-full w-full opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] font-black select-none">
          404
        </div>
      </div>
    </div>
  );
}

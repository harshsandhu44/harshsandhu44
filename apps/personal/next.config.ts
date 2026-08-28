import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /* Keystatic's reader hits the filesystem, and every route here is dynamic
   * (they read searchParams for the pane layout), so the read happens per
   * request inside the function rather than at build. Next's tracer cannot see
   * through fs calls, so without this the content directory is left out of the
   * bundle and every content route 500s in production while working perfectly
   * on a local `next start`, which runs from the project directory. */
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
};

export default nextConfig;

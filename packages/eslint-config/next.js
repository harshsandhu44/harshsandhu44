import next from "eslint-config-next";
import prettier from "eslint-config-prettier";

import { base } from "./base.js";

/**
 * Flat config for Next.js apps. Spread into the app's eslint.config.mjs:
 *   import { next } from "@hs95/eslint-config/next";
 *   export default next;
 *
 * eslint-config-next already bundles the react, react-hooks, jsx-a11y and
 * import plugins, so we only add our shared base on top and turn off
 * formatting rules last.
 */
export const nextConfig = [...base, ...next, prettier];

export { nextConfig as next };
export default nextConfig;

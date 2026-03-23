import { defineConfig, globalIgnores } from "eslint/config";
import sharedConfig from "@harshsandhu44/config/eslint";

const eslintConfig = defineConfig([
  ...sharedConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

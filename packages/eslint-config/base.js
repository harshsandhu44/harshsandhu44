import js from "@eslint/js";
import tseslint from "typescript-eslint";
import turbo from "eslint-plugin-turbo";
import prettier from "eslint-config-prettier";

/** Shared flat config for any TypeScript package in the monorepo. */
export const base = [
  { ignores: ["node_modules/**", "dist/**", ".next/**", ".turbo/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  turbo.configs["flat/recommended"],
  prettier,
];

export default base;

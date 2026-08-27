import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import base from "./base.mjs";

// prettier last: it only turns rules off, so it must win over everything above.
export default defineConfig([...base, ...nextVitals, ...nextTs, prettier]);

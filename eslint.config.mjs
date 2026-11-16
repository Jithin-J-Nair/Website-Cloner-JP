import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".agents/**",
    "agent/**",
    // Research scratch and read-only skill examples are not application code.
    "temp/**",
    "skills/**",
    // Unmodified third-party Three.js r128, required by the supplied scan HTML.
    "public/sites/jithin/three-r128.min.js",
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

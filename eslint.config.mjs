import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reference/vendor folders - not part of the product
    "refference/**",
    "refference2/**",
    "**/*_files/**",
  ]),
  // Disable overly-strict rules
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      // Downgrade prefer-const to warning for flexibility in legacy code
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;

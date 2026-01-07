import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

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
  ]),
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
    files: ["**/*.{ts,tsx,js,jsx}"]
  },
  // Phase-1 ship mode: relax noisy rules to warnings
  {
    rules: {
      // MUST stay error (runtime correctness)
      "react-hooks/rules-of-hooks": "error",

      // Allow ship; fix progressively
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }
      ],
      // Optional: JSX quotes becoming warnings
      "react/no-unescaped-entities": "warn",
    },
  },
  // Cypress override: disable namespace rule in tests
  {
    files: ["cypress/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-namespace": "off",
    },
  },
]);

export default eslintConfig;

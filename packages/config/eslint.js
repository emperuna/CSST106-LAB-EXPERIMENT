import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const importFeatureThroughIndex = {
  group: ["@/features/*/*"],
  message: "Import a feature through its index.ts, not its internal files.",
};

export default tseslint.config(
  { ignores: ["**/dist/", "**/.astro/", "**/node_modules/", "**/*.d.ts", ".venv/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: { globals: globals.browser },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": ["error", { patterns: [importFeatureThroughIndex] }],
    },
  },
  {
    // A feature cannot reach into another feature; shared code belongs in packages/.
    files: ["**/src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            importFeatureThroughIndex,
            { group: ["@/features/*"], message: "Features must not import other features." },
            {
              group: ["../../*"],
              message: "Stay inside this feature; use packages/ for shared code.",
            },
          ],
        },
      ],
    },
  },
);

import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { fileURLToPath, URL } from "node:url";

const fromRoot = (path) => fileURLToPath(new URL(`../../${path}`, import.meta.url));

// Static output: the built site needs no Node server. Only the islands use the API.
export default defineConfig({
  output: "static",
  integrations: [react()],
  // Astro's floating dev toolbar sat over the bottom of the page during development.
  devToolbar: { enabled: false },
  vite: {
    resolve: {
      // Real lab results and sample images, imported where the page shows them.
      alias: {
        "@outputs": fromRoot("outputs"),
        "@samples": fromRoot("packages/cv-labs/samples"),
      },
    },
  },
});

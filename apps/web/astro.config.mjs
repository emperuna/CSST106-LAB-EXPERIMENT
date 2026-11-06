import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// Static output: the built site needs no Node server. Only the islands use the API.
export default defineConfig({
  output: "static",
  integrations: [react()],
});

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const labs = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/labs" }),
  schema: z.object({
    number: z.number(),
    title: z.string(),
    week: z.string(),
    summary: z.string(),
    objective: z.string(),
  }),
});

export const collections = { labs };

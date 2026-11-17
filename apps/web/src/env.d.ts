/// <reference types="astro/client" />

// Lets TypeScript files re-export Astro components, such as a feature's index.ts.
declare module "*.astro" {
  const Component: (props: Record<string, unknown>) => unknown;
  export default Component;
}

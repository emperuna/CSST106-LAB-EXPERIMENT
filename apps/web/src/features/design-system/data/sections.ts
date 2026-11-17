/** The design system page's sections, in order. Each names the source it documents. */
export const sections = [
  { id: "brand", title: "Brand", intro: "The dithered lens and the wordmark, in one ink.", source: "BRAND.md" },
  { id: "color", title: "Color", intro: "Graphite surfaces, one teal accent. Tone separates surfaces; nothing casts a shadow.", source: "packages/tokens/tokens.css" },
  { id: "type", title: "Type", intro: "Geist Serif names things, Geist Sans explains them, DM Mono reads them out.", source: "packages/tokens/fonts.css" },
  { id: "space", title: "Space and shape", intro: "A 4 px spacing scale, small radii and 1 px hairlines.", source: "packages/tokens/tokens.css" },
  { id: "motion", title: "Motion", intro: "Short and calm: hover feedback, and panels that fade and reveal. Nothing bounces.", source: "packages/tokens/tokens.css" },
  { id: "icons", title: "Icons", intro: "Lucide outlines, curated. Add new ones to the set and to this page.", source: "packages/ui/src/icons" },
  { id: "controls", title: "Controls", intro: "Buttons, fields and the procedure step that groups them.", source: "packages/ui/src/components" },
  { id: "feedback", title: "Feedback", intro: "Status, loading, empty and error states, tabs and the gauge.", source: "packages/ui/src/components" },
  { id: "results", title: "Results", intro: "Readouts, the viewer and filmstrip, charts and readout tables, as every lab shows them.", source: "packages/ui/src/components/result-view" },
] as const;

export const colorGroups = [
  { title: "Surfaces", tokens: ["--color-bg", "--color-surface", "--color-sunken", "--color-well"] },
  { title: "Ink", tokens: ["--color-text", "--color-muted", "--color-focus"] },
  { title: "Lines", tokens: ["--color-border", "--color-border-strong", "--color-grid", "--color-tick"] },
  { title: "Accent", tokens: ["--color-accent", "--color-accent-hover", "--color-accent-soft", "--color-accent-ink"] },
  { title: "Status", tokens: ["--color-success", "--color-danger", "--color-danger-surface"] },
  { title: "Chart series, in order", tokens: ["--series-1", "--series-2", "--series-3", "--series-4", "--series-5"] },
];

export const typeScale = ["--text-3xl", "--text-2xl", "--text-xl", "--text-lg", "--text-md", "--text-sm", "--text-xs"];
export const spaceScale = ["--space-1", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-8", "--space-12", "--space-16", "--space-24"];
export const radii = ["--radius-sm", "--radius", "--radius-lg", "--radius-pill"];
export const motion = ["--duration", "--duration-panel", "--ease"];

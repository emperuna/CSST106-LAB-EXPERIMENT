export type ModelName = "coco" | "wildlife";

export const MODELS: { value: ModelName; label: string }[] = [
  { value: "coco", label: "Pre-trained (80 classes)" },
  { value: "wildlife", label: "Custom wildlife (4 classes)" },
];

export const SIZES = [
  { value: 320, label: "320 px (faster)" },
  { value: 640, label: "640 px (more accurate)" },
];

/** A 0 to 1 confidence as a whole percentage. */
export const percent = (value: number) => `${Math.round(value * 100)}%`;

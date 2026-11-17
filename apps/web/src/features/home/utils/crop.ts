export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Inline style that shows one rectangle of an image filling a frame of the given aspect ratio
 * (width / height), like object-fit: cover but on part of the image. Used to pick one panel out of
 * a saved lab figure without making a copy of it. The frame needs position: relative and
 * overflow: hidden; the image is positioned absolutely inside it.
 */
export function cropRules(source: { width: number; height: number }, rect: Rect, aspect: number) {
  // The part of the rectangle that is visible after covering the frame.
  const tooTall = rect.w / rect.h < aspect;
  const visW = tooTall ? rect.w : rect.h * aspect;
  const visH = tooTall ? rect.w / aspect : rect.h;
  const x0 = rect.x + (rect.w - visW) / 2;
  const y0 = rect.y + (rect.h - visH) / 2;
  const pct = (value: number) => `${(value * 100).toFixed(3)}%`;
  return {
    position: "absolute",
    maxWidth: "none",
    height: "auto",
    width: pct(source.width / visW),
    left: pct(-x0 / visW),
    top: pct(-y0 / visH),
  } as const;
}

/** The same rules as a style attribute, for Astro markup. */
export function cropStyle(source: { width: number; height: number }, rect: Rect, aspect: number) {
  return Object.entries(cropRules(source, rect, aspect))
    .map(([name, value]) => `${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`)
    .join("; ");
}

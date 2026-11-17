/**
 * Draws one still image in the hero's dither: square pixels on an 8 x 8 Bayer pattern, brighter
 * areas fuller and moving from teal to ink, exactly as the hero's shader draws the video. Used for
 * the closing frame, a Lab 6 detection result, without a second video.
 */

const b2 = (x: number, y: number) => {
  const v = x / 2 + y * y * 0.75;
  return v - Math.floor(v);
};
// The same thresholds as bayer8 in the hero shader.
const bayer = (x: number, y: number) =>
  (b2(Math.floor(x / 4), Math.floor(y / 4)) * 0.25 + b2(Math.floor(x / 2), Math.floor(y / 2))) *
    0.25 +
  b2(x, y);

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hex = (value: string) => {
  const h = value.trim().replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

export interface StillOptions {
  /** Size of one dither dot, in CSS pixels. */
  dot: number;
  /** Token colours: the accent for dim dots, the ink for the brightest. */
  accent: string;
  ink: string;
}

/**
 * Fills the canvas (already sized to width x height CSS pixels at `ratio`) with the dithered
 * image, cover-fitted. A calm area in the middle keeps the closing line readable, and the lower
 * part thins out to nothing, so the picture dissolves into the footer.
 */
export function drawDitherStill(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  ratio: number,
  { dot, accent, ink }: StillOptions,
) {
  const cols = Math.ceil(width / dot);
  const rows = Math.ceil(height / dot);

  // Sample the image once per dot, cover-fitted, by drawing it small.
  const sample = document.createElement("canvas");
  sample.width = cols;
  sample.height = rows;
  const sctx = sample.getContext("2d", { willReadFrequently: true })!;
  const scale = Math.max(cols / image.naturalWidth, rows / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  sctx.drawImage(image, (cols - w) / 2, (rows - h) / 2, w, h);
  const data = sctx.getImageData(0, 0, cols, rows).data;

  // Group the dots into a few colour steps, so each step is one fill.
  const steps = 8;
  const paths = Array.from({ length: steps }, () => new Path2D());
  const size = dot * 0.82;
  const inset = (dot - size) / 2;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4;
      const luma = (0.299 * data[k]! + 0.587 * data[k + 1]! + 0.114 * data[k + 2]!) / 255;
      // Quieter in the middle, behind the closing line.
      const dx = (i + 0.5) / cols - 0.5;
      const dy = ((j + 0.5) / rows - 0.5) * 2.2;
      const calm = 0.7 + 0.3 * smooth(0.18, 0.5, Math.hypot(dx, dy));
      // A short fade in at the top, and a long one out at the bottom, so the picture dissolves
      // into the footer below it.
      const y = (j + 0.5) / rows;
      const tail = smooth(0, 0.14, y) * smooth(1, 0.5, y);
      const level = smooth(0.2, 0.95, luma) * calm * tail;
      if (bayer(i, j) + 0.02 >= level) continue;
      const step = Math.min(steps - 1, Math.floor(level * steps));
      paths[step]!.rect(i * dot + inset, j * dot + inset, size, size);
    }
  }

  const a = hex(accent);
  const b = hex(ink);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  paths.forEach((path, step) => {
    const level = (step + 0.5) / steps;
    const t = smooth(0.55, 1, level);
    const mix = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * t);
    ctx.fillStyle = `rgba(${mix(0)}, ${mix(1)}, ${mix(2)}, ${0.45 + 0.45 * level})`;
    ctx.fill(path);
  });
}

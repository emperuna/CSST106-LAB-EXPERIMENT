/**
 * The "image is a grid of numbers" zoom: from the whole photo, into the pixels around one point
 * until they fill the frame, then each pixel's brightness written on it. Everything is drawn from
 * the image's real pixels.
 */

export interface PixelSource {
  colour: HTMLCanvasElement;
  grey: HTMLCanvasElement;
  /** Brightness 0 to 255 per pixel, row by row. */
  luma: Uint8ClampedArray;
  size: number;
}

export interface ZoomOptions {
  /** The point zoomed into, in image pixels. */
  target: { x: number; y: number };
  /** Where the whole photo rests at the start: its centre and side length, in CSS pixels. */
  rest: { x: number; y: number; size: number };
  /** On-screen size of one pixel at full zoom, in CSS pixels. */
  finalCell: number;
  /** Token colours: numbers on light pixels, numbers on dark pixels, and the grid lines. */
  ink: { onLight: string; onDark: string; grid: string };
}

export interface ZoomState {
  /** On-screen size of one image pixel, in CSS pixels. */
  cell: number;
  zoom: number;
  /** How many image pixels are on screen, across and down. */
  across: number;
  down: number;
  /** 0: photo, 1: pixels, 2: numbers. */
  step: 0 | 1 | 2;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Reads the image once into a colour copy, a grey copy and its brightness values. */
export function readPixels(image: HTMLImageElement): PixelSource {
  const size = image.naturalWidth;
  const colour = document.createElement("canvas");
  colour.width = colour.height = size;
  const ctx = colour.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, size, size);
  const luma = new Uint8ClampedArray(size * size);
  const greyData = new ImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const r = data.data[i * 4]!;
    const g = data.data[i * 4 + 1]!;
    const b = data.data[i * 4 + 2]!;
    // The same weights OpenCV uses for BGR to grayscale in Lab 1.
    const y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    luma[i] = y;
    greyData.data.set([y, y, y, 255], i * 4);
  }
  const grey = document.createElement("canvas");
  grey.width = grey.height = size;
  grey.getContext("2d")!.putImageData(greyData, 0, 0);
  return { colour, grey, luma, size };
}

/**
 * Draws the frame for scroll progress p (0 to 1) on a canvas of width x height CSS pixels.
 * At p = 0 the whole photo sits at its rest position; by the end its pixels fill the frame.
 * Returns what is on screen, for the readout.
 */
export function drawZoom(
  ctx: CanvasRenderingContext2D,
  source: PixelSource,
  width: number,
  height: number,
  p: number,
  { target, rest, finalCell, ink }: ZoomOptions,
): ZoomState {
  const { size } = source;
  // Zoom on a log scale so it feels even, from the rest size to `finalCell` per pixel.
  const t = smooth(0.06, 0.72, p);
  const fit = rest.size / size;
  const cell = Math.exp(Math.log(fit) + (Math.log(finalCell) - Math.log(fit)) * t);
  const pull = smooth(0, 0.3, t);
  const cx = size / 2 + (target.x + 0.5 - size / 2) * pull;
  const cy = size / 2 + (target.y + 0.5 - size / 2) * pull;
  // The zoom point moves from the rest position to the frame's centre as the pixels take over.
  const ax = rest.x + (width / 2 - rest.x) * pull;
  const ay = rest.y + (height / 2 - rest.y) * pull;
  // Image coordinates at the frame's top-left corner.
  const left = cx - ax / cell;
  const top = cy - ay / cell;

  // Only the pixels that are on screen, as whole pixels so their edges stay crisp.
  const x0 = Math.max(0, Math.floor(left));
  const y0 = Math.max(0, Math.floor(top));
  const x1 = Math.min(size, Math.ceil(left + width / cell));
  const y1 = Math.min(size, Math.ceil(top + height / cell));
  const at = (x: number, y: number) => [(x - left) * cell, (y - top) * cell] as const;
  const [dx, dy] = at(x0, y0);
  const dw = (x1 - x0) * cell;
  const dh = (y1 - y0) * cell;

  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = cell < 2;
  ctx.drawImage(source.colour, x0, y0, x1 - x0, y1 - y0, dx, dy, dw, dh);

  // Step 3: the squares turn grey as their numbers appear.
  const numbers = smooth(0.8, 0.95, p);
  if (numbers > 0) {
    ctx.globalAlpha = numbers;
    ctx.drawImage(source.grey, x0, y0, x1 - x0, y1 - y0, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  }

  // Step 2: grid lines between pixels, once they are big enough to see.
  const grid = smooth(10, 22, cell);
  if (grid > 0) {
    ctx.globalAlpha = 0.55 * grid;
    ctx.strokeStyle = ink.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x0; x <= x1; x++) {
      const sx = Math.round(at(x, 0)[0]) + 0.5;
      ctx.moveTo(sx, dy);
      ctx.lineTo(sx, dy + dh);
    }
    for (let y = y0; y <= y1; y++) {
      const sy = Math.round(at(0, y)[1]) + 0.5;
      ctx.moveTo(dx, sy);
      ctx.lineTo(dx + dw, sy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (numbers > 0) {
    ctx.font = `500 ${Math.min(18, cell * 0.28)}px "DM Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = numbers;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const value = source.luma[y * size + x]!;
        ctx.fillStyle = value > 140 ? ink.onLight : ink.onDark;
        const [sx, sy] = at(x + 0.5, y + 0.5);
        ctx.fillText(String(value), sx, sy);
      }
    }
    ctx.globalAlpha = 1;
  }

  return {
    cell,
    zoom: cell / fit,
    across: x1 - x0,
    down: y1 - y0,
    step: numbers > 0.5 ? 2 : grid > 0.5 ? 1 : 0,
  };
}

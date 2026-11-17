import { useCallback, useEffect, useRef } from "react";
import { drawZoom, readPixels, type PixelSource, type ZoomState } from "../utils/pixelZoom";

// The pupil of her right eye in the 512 x 512 Lab 1 sample (found from the darkest pixels there):
// a computer "seeing" an eye.
const TARGET = { x: 205, y: 100 };
/**
 * Where the whole photo rests before the zoom: centred in the view with a margin around it. A still
 * simply fills its square.
 */
function restFor(layout: "stage" | "still", width: number, height: number) {
  const size = Math.min(width, height) * (layout === "still" ? 1 : 0.86);
  return { x: width / 2, y: height / 2, size };
}

const token = (element: Element, name: string) =>
  getComputedStyle(element).getPropertyValue(name).trim();

/**
 * Draws the pixel zoom on a canvas for a given progress (0 to 1), from the image's real
 * pixels. Redraws on resize and once fonts load; call `redraw` when the progress changes.
 */
export function useZoomCanvas(
  src: string,
  getProgress: () => number,
  onDraw?: (state: ZoomState) => void,
  /** "stage" leaves room for the caption panel; "still" fills a small square on its own. */
  layout: "stage" | "still" = "stage",
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(() => undefined as void);
  // The latest callbacks, so the effect below runs once per image.
  const latest = useRef({ getProgress, onDraw });
  latest.current = { getProgress, onDraw };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let source: PixelSource | null = null;
    let width = 0;
    let height = 0;
    let ratio = 1;

    const draw = () => {
      if (!source || !width || !height) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const state = drawZoom(ctx, source, width, height, latest.current.getProgress(), {
        target: TARGET,
        rest: restFor(layout, width, height),
        // At full zoom each pixel is big enough for its number; a little smaller on a phone.
        finalCell:
          layout === "still"
            ? Math.min(width, height) / 7
            : Math.min(width, height) < 520
              ? 52
              : 84,
        ink: {
          onLight: token(canvas, "--color-accent-ink"),
          onDark: token(canvas, "--color-text"),
          grid: token(canvas, "--color-accent-ink"),
        },
      });
      latest.current.onDraw?.(state);
    };
    drawRef.current = draw;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const image = new Image();
    image.onload = () => {
      source = readPixels(image);
      resize();
    };
    image.src = src;
    // The numbers use DM Mono; draw again once it has loaded.
    void document.fonts?.ready.then(draw);

    return () => {
      observer.disconnect();
      image.onload = null;
    };
  }, [src, layout]);

  const redraw = useCallback(() => drawRef.current(), []);
  return { canvasRef, redraw };
}

import { useEffect, useRef } from "react";
import { drawDitherStill } from "../utils/ditherStill";

interface Props {
  src: string;
}

const token = (element: Element, name: string) => getComputedStyle(element).getPropertyValue(name);

/** A still image in the hero's dither. Drawn once, and again when resized. */
export function DitherStill({ src }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const image = new Image();
    let ready = false;

    const draw = () => {
      if (!ready) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      drawDitherStill(ctx, image, width, height, ratio, {
        dot: width < 640 ? 2.5 : 3,
        accent: token(canvas, "--color-accent"),
        ink: token(canvas, "--color-text"),
      });
    };

    image.onload = () => {
      ready = true;
      draw();
    };
    image.src = src;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      image.onload = null;
    };
  }, [src]);

  return <canvas ref={canvasRef} className="finale-still" aria-hidden="true" />;
}

import { useEffect, useRef, useState } from "react";
import { createDitherRenderer, type DitherRenderer } from "../utils/ditherRenderer";

const dotSize = () => (window.innerWidth < 640 ? 2.5 : 3);
// Colours come from the design tokens, so the dither always matches the palette.
const token = (element: Element, name: string) => getComputedStyle(element).getPropertyValue(name);

/**
 * Drives the dithered hero video: plays it muted in a loop, pauses it off screen, keeps it on a
 * still frame under reduced motion, and follows resizes. Returns true when WebGL2
 * is missing, so the caller shows the poster instead.
 */
export function useDitherVideo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fallback, setFallback] = useState(false);
  const wantPlay = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    // React does not reliably set the muted attribute, and browsers only autoplay muted video.
    video.muted = true;
    video.defaultMuted = true;
    let renderer: DitherRenderer | null = null;
    try {
      renderer = createDitherRenderer(canvas, video, dotSize);
    } catch {
      renderer = null;
    }
    if (!renderer) {
      setFallback(true);
      return;
    }
    const r = renderer;
    const applyColours = () =>
      r.setColours(token(canvas, "--color-text"), token(canvas, "--color-accent"));
    // On a first, uncached load the stylesheet can arrive after this runs, so the tokens are
    // still empty. Keep trying each frame until they resolve, then size the canvas again too.
    let coloured = applyColours();
    r.resize();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) wantPlay.current = false;

    let frame = 0;
    const loop = () => {
      if (!coloured) {
        coloured = applyColours();
        if (coloured) r.resize();
      }
      r.draw();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    };
    video.addEventListener("loadeddata", () => r.draw());
    video.addEventListener("seeked", () => r.draw());
    start();

    // Only play while the hero is on screen.
    // The hero starts on screen, so playback starts at once; the observer pauses it later.
    let onScreen = true;
    const play = () => {
      if (onScreen && wantPlay.current) void video.play().catch(() => undefined);
    };
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      if (onScreen) play();
      else video.pause();
    });
    video.addEventListener("canplay", play);
    play();
    visibility.observe(canvas);

    const resize = new ResizeObserver(() => {
      r.resize();
      r.draw();
    });
    resize.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
      r.dispose();
    };
  }, []);

  return { canvasRef, videoRef, fallback };
}

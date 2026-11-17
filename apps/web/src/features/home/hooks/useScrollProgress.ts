import { useEffect, type RefObject } from "react";

/**
 * Reports how far the page has scrolled through a tall track, from 0 when its top reaches the top
 * of the window to 1 when its bottom reaches the bottom. Used to drive a pinned stage.
 */
export function useScrollProgress(
  trackRef: RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void,
) {
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Measured on every scroll event, so it stays right even where animation frames are paused.
    const measure = () => {
      const rect = track.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      onProgress(distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 0);
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [trackRef, onProgress]);
}

import { useEffect, useRef, useState, type MouseEvent } from "react";

// Ease in and out, so the page starts gently, travels, and settles without a jolt.
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
// Longer trips take a little longer, within limits that still feel quick.
const durationFor = (distance: number) => Math.min(1100, 500 + distance * 0.15);
const STOP_EVENTS = ["wheel", "touchstart", "keydown"] as const;

/**
 * Smooth scrolling to in-page sections, driven by script so it looks the same in every browser.
 * While it runs, `target` holds the destination, so the bar marks it straight away instead of every
 * section passed on the way. Scrolling by hand stops it. Under reduced motion it jumps at once.
 */
export function useScrollTarget() {
  const [target, setTarget] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => undefined);

  useEffect(() => () => stopRef.current(), []);

  function scrollTo(id: string) {
    const section = document.getElementById(id);
    if (!section) return false;
    stopRef.current();

    const from = window.scrollY;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const to = Math.min(maxY, Math.max(0, section.getBoundingClientRect().top + from));
    history.pushState(null, "", `#${id}`);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from === to) {
      window.scrollTo(0, to);
      return true;
    }

    setTarget(id);
    const start = performance.now();
    const duration = durationFor(Math.abs(to - from));
    let frame = 0;
    const stop = () => {
      cancelAnimationFrame(frame);
      STOP_EVENTS.forEach((name) => window.removeEventListener(name, stop));
      stopRef.current = () => undefined;
      setTarget(null);
    };
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + (to - from) * ease(t));
      if (t < 1) frame = requestAnimationFrame(step);
      else stop();
    };
    STOP_EVENTS.forEach((name) => window.addEventListener(name, stop, { passive: true }));
    stopRef.current = stop;
    frame = requestAnimationFrame(step);
    return true;
  }

  /** Click handler for links like "#results": glides there instead of jumping. */
  function onLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    const href = event.currentTarget.getAttribute("href") ?? "";
    // Leave modified clicks (new tab, new window) to the browser.
    if (!href.startsWith("#") || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (scrollTo(href.slice(1))) event.preventDefault();
  }

  return { target, onLinkClick };
}

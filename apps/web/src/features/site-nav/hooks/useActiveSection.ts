import { useEffect, useState, type RefObject } from "react";

/** The id of the linked section currently behind the bar, or null over anything else. */
export function useActiveSection(barRef: RefObject<HTMLElement | null>, ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(" ");

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const linked = key ? key.split(" ") : [];
    // One hit test per scroll event is cheap, and it stays correct even where frames are paused.
    const measure = () => {
      // The bar is transparent, so read the page behind it: at its left edge, past the logo.
      const rect = bar.getBoundingClientRect();
      const point = document.elementFromPoint(2, rect.top + rect.height / 2);
      // The open menu can cover that spot; keep the last reading while it does.
      if (!point || bar.contains(point)) return;
      const section = point.closest<HTMLElement>("section[id], footer[id]");
      setActive(section && linked.includes(section.id) ? section.id : null);
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [barRef, key]);

  return active;
}

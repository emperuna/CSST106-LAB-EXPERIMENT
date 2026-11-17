import { useEffect, useState, type RefObject } from "react";

export interface Link {
  d: string;
  width: number;
  height: number;
}

/**
 * Draws a stepped line from the active control to the first line of code it feeds, measured from
 * the real layout. Returns null when the two sit one above the other (narrow screens), where the
 * highlight alone carries the link.
 */
export function useLinkLine(rootRef: RefObject<HTMLElement | null>, active: string) {
  const [link, setLink] = useState<Link | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const box = root.getBoundingClientRect();
      const control = root.querySelector(`[data-control="${active}"]`)?.getBoundingClientRect();
      const line = root.querySelector(`[data-line="${active}"]`)?.getBoundingClientRect();
      if (!control || !line || line.left < control.right) {
        setLink(null);
        return;
      }
      const x1 = control.right - box.left;
      const y1 = control.top - box.top + control.height / 2;
      const x2 = line.left - box.left;
      const y2 = line.top - box.top + line.height / 2;
      const mid = (x1 + x2) / 2;
      setLink({
        d: `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`,
        width: box.width,
        height: box.height,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [rootRef, active]);

  return link;
}

import { useLayoutEffect, useState, type RefObject } from "react";

export interface IndicatorBox {
  x: number;
  width: number;
  visible: boolean;
}

/**
 * Where the pill's sliding indicator sits: under the link for the current section. With no current
 * section it fades out in place, so it slides from there to the next one.
 */
export function usePillIndicator(pillRef: RefObject<HTMLElement | null>, href: string | null) {
  const [box, setBox] = useState<IndicatorBox>({ x: 0, width: 0, visible: false });

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const measure = () => {
      const link = href ? pill.querySelector<HTMLElement>(`a[href="${href}"]`) : null;
      setBox((current) =>
        link
          ? { x: link.offsetLeft, width: link.offsetWidth, visible: true }
          : { ...current, visible: false },
      );
    };
    measure();
    // Fonts loading or the window resizing change the links' widths.
    const resize = new ResizeObserver(measure);
    resize.observe(pill);
    return () => resize.disconnect();
  }, [pillRef, href]);

  return box;
}

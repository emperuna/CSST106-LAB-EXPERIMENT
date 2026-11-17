import { useEffect, useState } from "react";

/** True once the page has scrolled more than `threshold` pixels from the top. */
export function useScrolled(threshold = 16) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const measure = () => setScrolled(window.scrollY > threshold);
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    return () => window.removeEventListener("scroll", measure);
  }, [threshold]);

  return scrolled;
}

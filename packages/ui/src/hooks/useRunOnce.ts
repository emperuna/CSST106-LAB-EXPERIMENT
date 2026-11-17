import { useEffect, useRef } from "react";

/** Run a callback once after the first render, using its first version. */
export function useRunOnce(callback: () => void) {
  const first = useRef(callback);
  useEffect(() => first.current(), []);
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { useZoomCanvas } from "../hooks/useZoomCanvas";
import type { ZoomState } from "../utils/pixelZoom";

interface Props {
  src: string;
}

const STEPS = [
  { title: "A photo", text: "The Lab 1 sample: 512 by 512 pixels, 262,144 in all." },
  { title: "A grid of squares", text: "Closer in, each pixel is one square of a single colour." },
  {
    title: "A grid of numbers",
    text: "In grayscale, each square is one brightness from 0 to 255. This is what the labs compute on.",
  },
] as const;

// The progress each still shows when motion is reduced.
const STILLS = [0, 0.62, 1];

/**
 * Section 2 of the home page: scrolling zooms from the whole photo into its pixels, then into the
 * numbers stored for each one. The stage stays pinned while the page scrolls through a tall track.
 * Under reduced motion the three steps are shown side by side instead.
 */
export function PixelZoom({ src }: Props) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduced ? <PixelZoomStills src={src} /> : <PixelZoomScroll src={src} />;
}

function Heading() {
  return <h2 id="pixels-title">An image is a grid of numbers</h2>;
}

function PixelZoomScroll({ src }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  const [step, setStep] = useState<ZoomState["step"]>(0);

  const onDraw = useCallback((state: ZoomState) => {
    setStep(state.step);
    if (readoutRef.current) {
      readoutRef.current.textContent = `×${state.zoom.toFixed(1)} · ${state.across} × ${state.down} pixels`;
    }
  }, []);
  const { canvasRef, redraw } = useZoomCanvas(src, () => progress.current, onDraw);
  const onProgress = useCallback(
    (value: number) => {
      progress.current = value;
      redraw();
    },
    [redraw],
  );
  useScrollProgress(trackRef, onProgress);
  const current = STEPS[step];

  return (
    <div ref={trackRef} className="pixel-track">
      <div className="pixel-stage">
        <div className="wrap pixel-head">
          <Heading />
          <div className="pixel-meta">
            <div className="pixel-meta-line">
              <ol className="pixel-progress" aria-label="Steps">
                {STEPS.map((item, index) => (
                  <li
                    key={item.title}
                    aria-current={index === step ? "step" : undefined}
                    data-done={index < step || undefined}
                  >
                    <span className="visually-hidden">{item.title}</span>
                  </li>
                ))}
              </ol>
              <span className="pixel-count">0{step + 1} / 03</span>
              <span ref={readoutRef} className="pixel-readout" aria-hidden="true" />
            </div>
            <p key={step} className="pixel-caption" aria-live="polite">
              <strong>{current.title}.</strong> {current.text}
            </p>
          </div>
        </div>
        <div className="pixel-view">
          <canvas
            ref={canvasRef}
            className="pixel-canvas"
            role="img"
            aria-label="The Lab 1 astronaut photo, zooming into the pixels around her eye, then showing each pixel's brightness from 0 to 255."
          />
        </div>
      </div>
    </div>
  );
}

function PixelZoomStills({ src }: Props) {
  return (
    <div className="pixel-stills wrap">
      <Heading />
      <ol className="pixel-still-row">
        {STEPS.map((item, index) => (
          <li key={item.title}>
            <Still src={src} progress={STILLS[index]!} label={item.title} />
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Still({ src, progress, label }: { src: string; progress: number; label: string }) {
  const { canvasRef } = useZoomCanvas(src, () => progress, undefined, "still");
  return <canvas ref={canvasRef} className="pixel-canvas" role="img" aria-label={label} />;
}

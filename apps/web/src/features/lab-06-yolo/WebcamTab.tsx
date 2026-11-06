import { api, formBody, unwrap } from "@csst106/api-client";
import { RangeField, SelectField } from "@csst106/ui";
import { useEffect, useRef, useState } from "react";
import type { ModelName } from "./YoloLab";

const FRAME_WIDTH = 640;

function cameraError(error: unknown): string {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError")
    return "Camera permission was denied. Allow it in your browser, then try again.";
  if (name === "NotFoundError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is being used by another app.";
  return error instanceof Error ? error.message : "The camera could not be started.";
}

/**
 * Real-time detection: send a frame, draw the result, then send the next. Waiting for each
 * reply means the frame rate adjusts itself to what the computer can handle.
 */
export function WebcamTab({ models }: { models: { value: ModelName; label: string }[] }) {
  const video = useRef<HTMLVideoElement>(null);
  const settings = useRef({ model: "coco" as ModelName, conf: 0.25 });
  const stopRef = useRef<(() => void) | null>(null);
  const [model, setModel] = useState<ModelName>("coco");
  const [conf, setConf] = useState(0.25);
  const [active, setActive] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);
  const [fps, setFps] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  settings.current = { model, conf };
  useEffect(() => () => stopRef.current?.(), []);

  async function start() {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 } },
        audio: false,
      });
    } catch (problem) {
      setError(cameraError(problem));
      return;
    }
    const element = video.current;
    if (!element) return;
    element.srcObject = stream;
    await element.play();
    let running = true;
    stopRef.current = () => {
      running = false;
      stream.getTracks().forEach((track) => track.stop());
      element.srcObject = null;
      stopRef.current = null;
      setActive(false);
    };
    setActive(true);

    const canvas = document.createElement("canvas");
    const started = performance.now();
    let frames = 0;
    while (running) {
      canvas.width = Math.min(FRAME_WIDTH, element.videoWidth);
      canvas.height = Math.round((canvas.width * element.videoHeight) / element.videoWidth) || 1;
      canvas.getContext("2d")?.drawImage(element, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8),
      );
      if (!blob || !running) break;
      try {
        const result = await unwrap(
          api.POST("/api/labs/lab06/detect", {
            body: {
              image: new File([blob], "frame.jpg", { type: "image/jpeg" }) as unknown as string,
              model: settings.current.model,
              conf: settings.current.conf,
              imgsz: 320,
            },
            bodySerializer: formBody,
          }),
        );
        if (!running) break;
        frames += 1;
        setFrame(result.panels?.[0]?.image ?? null);
        setCount(result.tables?.[0]?.rows.length ?? 0);
        setFps(frames / ((performance.now() - started) / 1000));
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : "Detection failed.");
        stopRef.current?.();
      }
    }
  }

  return (
    <div className="workbench">
      <div className="controls">
        <SelectField label="Model" value={model} options={models} onChange={setModel} />
        <RangeField
          label="Confidence threshold"
          value={conf}
          min={0.05}
          max={0.95}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={setConf}
        />
        {active ? (
          <button type="button" className="button-secondary" onClick={() => stopRef.current?.()}>
            Stop camera
          </button>
        ) : (
          <button type="button" className="button" onClick={start}>
            Start camera
          </button>
        )}
        <p className="field-note">Frames go only to this project's API, and are not saved.</p>
      </div>
      <div className="output" aria-live="polite">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!active && !frame && !error && (
          <p className="waiting">Start the camera to detect objects live.</p>
        )}
        <div className="camera-grid">
          <video
            ref={video}
            className="camera-video"
            muted
            playsInline
            hidden={!active}
            aria-label="Camera preview"
          />
          {frame && (
            <img src={frame} alt="Latest frame with detected objects" className="camera-video" />
          )}
        </div>
        {fps !== null && (
          <p className="elapsed">
            {fps.toFixed(1)} FPS · {count} objects in the latest frame
          </p>
        )}
      </div>
    </div>
  );
}

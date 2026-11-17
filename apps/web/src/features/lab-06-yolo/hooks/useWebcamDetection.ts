import { api, formBody, unwrap } from "@csst106/api-client";
import { useEffect, useRef, useState } from "react";
import { cameraError } from "../utils/cameraError";
import type { ModelName } from "../utils/models";

const FRAME_WIDTH = 640;

/**
 * Real-time detection: send a frame, draw the result, then send the next. Waiting for each
 * reply means the frame rate adjusts itself to what the computer can handle.
 */
export function useWebcamDetection(model: ModelName, conf: number) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const settings = useRef({ model, conf });
  const stopRef = useRef<(() => void) | null>(null);
  const [active, setActive] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);
  const [fps, setFps] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The loop reads the latest settings, so changing them takes effect on the next frame.
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
    const element = videoRef.current;
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

  const stop = () => stopRef.current?.();

  return { videoRef, active, frame, fps, count, error, start, stop };
}

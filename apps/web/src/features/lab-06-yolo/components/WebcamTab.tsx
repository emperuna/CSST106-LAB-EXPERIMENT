import { ErrorMessage, RangeField, SelectField } from "@reticle/ui";
import { useState } from "react";
import { useWebcamDetection } from "../hooks/useWebcamDetection";
import "../styles/webcam.css";
import { MODELS, percent, type ModelName } from "../utils/models";

/** Live detection from the camera. The camera loop lives in useWebcamDetection. */
export function WebcamTab() {
  const [model, setModel] = useState<ModelName>("coco");
  const [conf, setConf] = useState(0.25);
  const { videoRef, active, frame, fps, count, error, start, stop } = useWebcamDetection(
    model,
    conf,
  );

  return (
    <div className="workbench">
      <div className="controls">
        <SelectField label="Model" value={model} options={MODELS} onChange={setModel} />
        <RangeField
          label="Confidence threshold"
          value={conf}
          min={0.05}
          max={0.95}
          step={0.05}
          format={percent}
          onChange={setConf}
        />
        {active ? (
          <button type="button" className="button button-secondary" onClick={stop}>
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
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!active && !frame && !error && (
          <p className="waiting">Start the camera to detect objects live.</p>
        )}
        <div className="camera-grid">
          <video
            ref={videoRef}
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

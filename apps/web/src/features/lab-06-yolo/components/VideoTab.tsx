import { FileField, RangeField, SelectField, Step, Workbench } from "@reticle/ui";
import { useState } from "react";
import { useVideoDetect } from "../hooks/useVideoDetect";
import { MODELS, percent, type ModelName } from "../utils/models";

export function VideoTab() {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<ModelName>("coco");
  const [conf, setConf] = useState(0.25);
  const run = useVideoDetect({ file, model, conf });
  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Processing video"
      runLabel="Detect in video"
      disabled={!file}
      emptyMessage="Choose a video file. Up to 120 evenly spaced frames are processed."
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <Step number={1} title="Run YOLO11" code="model.predict">
            <FileField
              label="Video file"
              accept="video/*"
              file={file}
              onChange={setFile}
              hint="Up to 60 MB. MP4 works best."
            />
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
          </Step>
        </>
      }
    />
  );
}

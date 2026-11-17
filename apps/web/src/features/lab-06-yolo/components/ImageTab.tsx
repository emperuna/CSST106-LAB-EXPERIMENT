import { useSamples, type ImageChoice } from "@csst106/api-client";
import { ImageSource, RangeField, SelectField, Step, Workbench } from "@reticle/ui";
import { useState } from "react";
import { useDetect } from "../hooks/useDetect";
import { MODELS, percent, SIZES, type ModelName } from "../utils/models";

export function ImageTab() {
  const samples = useSamples(["bus.jpg", "zidane.jpg", "input.jpg", "coffee.jpg"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "bus.jpg" });
  const [model, setModel] = useState<ModelName>("coco");
  const [conf, setConf] = useState(0.25);
  const [imgsz, setImgsz] = useState(640);
  const run = useDetect({ image, model, conf, imgsz });
  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Detecting"
      runLabel="Detect objects"
      emptyMessage="Run to detect objects. The first run also loads the model."
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <Step number={1} title="Run YOLO11" code="model.predict">
            <ImageSource samples={samples} value={image} onChange={setImage} />
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
            <SelectField
              label="Network input size"
              value={imgsz}
              options={SIZES}
              onChange={setImgsz}
            />
          </Step>
        </>
      }
    />
  );
}

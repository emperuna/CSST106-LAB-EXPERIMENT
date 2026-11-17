import { LabProvider, useSamples, type ImageChoice } from "@csst106/api-client";
import { ImageSource, RangeField, Step, useRunOnce, Workbench } from "@reticle/ui";
import { useState } from "react";
import { useHistogramRun } from "../hooks/useHistogramRun";

function Lab() {
  const samples = useSamples(["low_contrast.png", "coffee.jpg", "camera.png", "page.png"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "low_contrast.png" });
  const [clip, setClip] = useState(2);
  const [grid, setGrid] = useState(8);
  const [low, setLow] = useState(2);
  const [high, setHigh] = useState(98);

  const run = useHistogramRun({ image, clip, grid, low, high });
  useRunOnce(() => run.mutate());

  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <Step number={1} title="Load and convert to grayscale" code="cv2.cvtColor">
            <ImageSource samples={samples} value={image} onChange={setImage} />
          </Step>
          <Step number={4} title="Contrast stretching" code="np.percentile">
            <RangeField
              label="Stretch from percentile"
              value={low}
              min={0}
              max={49}
              onChange={setLow}
            />
            <RangeField
              label="Stretch to percentile"
              value={high}
              min={51}
              max={100}
              onChange={setHigh}
            />
          </Step>
          <Step number={5} title="CLAHE" code="cv2.createCLAHE">
            <RangeField
              label="Clip limit"
              value={clip}
              min={0.5}
              max={16}
              step={0.5}
              onChange={setClip}
              hint="Higher values allow more local contrast, and more noise."
            />
            <RangeField
              label="Tile grid"
              value={grid}
              min={2}
              max={32}
              format={(v) => `${v} x ${v}`}
              onChange={setGrid}
            />
          </Step>
        </>
      }
    />
  );
}

export function HistogramLab() {
  return (
    <LabProvider>
      <Lab />
    </LabProvider>
  );
}

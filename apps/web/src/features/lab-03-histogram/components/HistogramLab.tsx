import { LabProvider, useSamples, type ImageChoice } from "@csst106/api-client";
import { ImageSource, RangeField, useRunOnce, Workbench } from "@reticle/ui";
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
          <ImageSource samples={samples} value={image} onChange={setImage} />
          <RangeField
            label="CLAHE clip limit"
            value={clip}
            min={0.5}
            max={16}
            step={0.5}
            onChange={setClip}
            hint="Higher values allow more local contrast, and more noise."
          />
          <RangeField
            label="CLAHE tile grid"
            value={grid}
            min={2}
            max={32}
            format={(v) => `${v} x ${v}`}
            onChange={setGrid}
          />
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

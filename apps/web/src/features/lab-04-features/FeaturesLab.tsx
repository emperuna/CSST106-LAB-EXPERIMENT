import {
  api,
  formBody,
  imageFields,
  LabProvider,
  unwrap,
  useSamples,
  type ImageChoice,
} from "@csst106/api-client";
import { CheckField, FileField, ImageSource, RangeField, Workbench } from "@csst106/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

function Lab() {
  const samples = useSamples(["camera.png", "coffee.jpg", "input.jpg", "coins.png"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "camera.png" });
  const [second, setSecond] = useState<File | null>(null);
  const [threshold, setThreshold] = useState(400);
  const [degrees, setDegrees] = useState(30);
  const [scale, setScale] = useState(0.8);
  const [sweeps, setSweeps] = useState(false);

  const run = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab04/run", {
          body: {
            ...imageFields(image),
            second_image: (second ?? undefined) as unknown as string | undefined,
            threshold,
            degrees,
            scale,
            include_sweeps: sweeps,
          },
          bodySerializer: formBody,
        }),
      ),
  });

  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Detecting and matching"
      runLabel="Detect and match"
      emptyMessage="Run to compare SURF, U-SURF, SIFT and ORB. This takes a few seconds."
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <ImageSource samples={samples} value={image} onChange={setImage} label="First image" />
          <FileField
            label="Second image (optional)"
            accept="image/*"
            file={second}
            onChange={setSecond}
            hint="Without one, the first image is transformed so every match can be checked."
          />
          <RangeField
            label="Hessian threshold"
            value={threshold}
            min={50}
            max={3000}
            step={50}
            onChange={setThreshold}
            hint="Applies to SURF and U-SURF."
          />
          <RangeField
            label="Rotate second image"
            value={degrees}
            min={-180}
            max={180}
            step={5}
            disabled={second !== null}
            format={(v) => `${v}°`}
            onChange={setDegrees}
          />
          <RangeField
            label="Scale second image"
            value={scale}
            min={0.4}
            max={1.5}
            step={0.1}
            disabled={second !== null}
            format={(v) => `${v}x`}
            onChange={setScale}
          />
          <CheckField
            label="Also sweep thresholds and rotations"
            checked={sweeps}
            onChange={setSweeps}
            hint="Adds about 30 seconds."
          />
        </>
      }
    />
  );
}

export function FeaturesLab() {
  return (
    <LabProvider>
      <Lab />
    </LabProvider>
  );
}

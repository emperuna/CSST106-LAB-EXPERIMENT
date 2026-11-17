import { LabProvider, useSamples, type ImageChoice } from "@csst106/api-client";
import { ImageSource, RangeField, SelectField, Step, useRunOnce, Workbench } from "@reticle/ui";
import { useState } from "react";
import { useEdgesRun } from "../hooks/useEdgesRun";
import { kernelSizes } from "../utils/kernelSizes";

function Lab() {
  const samples = useSamples(["input.jpg", "coffee.jpg", "camera.png", "coins.png"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "input.jpg" });
  const [blur, setBlur] = useState(3);
  const [sobelSize, setSobelSize] = useState(3);
  const [low, setLow] = useState(100);
  const [high, setHigh] = useState(200);

  const run = useEdgesRun({ image, blur, sobelSize, low, high });
  useRunOnce(() => run.mutate());

  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <Step number={1} title="Convert to grayscale" code="cv2.cvtColor">
            <ImageSource samples={samples} value={image} onChange={setImage} />
          </Step>
          <Step number={2} title="Gaussian blur" code="cv2.GaussianBlur">
            <SelectField
              label="Kernel size"
              value={blur}
              options={kernelSizes([1, 3, 5, 7, 9])}
              onChange={setBlur}
              hint="1 x 1 means no blur."
            />
          </Step>
          <Step number={3} title="Sobel gradients" code="cv2.Sobel · cv2.magnitude">
            <SelectField
              label="Kernel size"
              value={sobelSize}
              options={kernelSizes([3, 5, 7])}
              onChange={setSobelSize}
            />
          </Step>
          <Step number={4} title="Canny" code="cv2.Canny">
            <RangeField
              label="Low threshold"
              value={low}
              min={0}
              max={500}
              step={5}
              onChange={setLow}
            />
            <RangeField
              label="High threshold"
              value={high}
              min={0}
              max={500}
              step={5}
              onChange={setHigh}
            />
          </Step>
        </>
      }
    />
  );
}

export function EdgesLab() {
  return (
    <LabProvider>
      <Lab />
    </LabProvider>
  );
}

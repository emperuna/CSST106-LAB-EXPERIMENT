import { LabProvider, useSamples, type ImageChoice } from "@csst106/api-client";
import {
  ColorField,
  ImageSource,
  NumberField,
  RangeField,
  SelectField,
  Step,
  useRunOnce,
  Workbench,
} from "@reticle/ui";
import { useState } from "react";
import { useImagesRun } from "../hooks/useImagesRun";
import { percent, times } from "../utils/format";

function Lab() {
  const samples = useSamples(["input.jpg", "coffee.jpg", "camera.png", "bus.jpg"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "input.jpg" });
  const [x, setX] = useState<number | undefined>();
  const [y, setY] = useState<number | undefined>();
  const [color, setColor] = useState("#ff0000");
  const [left, setLeft] = useState(25);
  const [right, setRight] = useState(75);
  const [top, setTop] = useState(25);
  const [bottom, setBottom] = useState(75);
  const [scale, setScale] = useState(0.5);
  const [direction, setDirection] = useState<"cw" | "ccw">("cw");

  const run = useImagesRun({
    image,
    x,
    y,
    color,
    left,
    right,
    top,
    bottom,
    scale,
    direction,
  });
  useRunOnce(() => run.mutate());

  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <Step number={1} title="Load the image">
            <ImageSource samples={samples} value={image} onChange={setImage} />
          </Step>
          <Step number={3} title="Read and change a pixel" code="image[y, x]">
            <div className="field-row">
              <NumberField label="Pixel x" value={x} min={0} placeholder="Center" onChange={setX} />
              <NumberField label="Pixel y" value={y} min={0} placeholder="Center" onChange={setY} />
            </div>
            <ColorField label="New pixel color" value={color} onChange={setColor} />
          </Step>
          <Step number={4} title="Crop a region" code="image[y1:y2, x1:x2]">
            <RangeField
              label="Crop left"
              value={left}
              min={0}
              max={100}
              format={percent}
              onChange={setLeft}
            />
            <RangeField
              label="Crop right"
              value={right}
              min={0}
              max={100}
              format={percent}
              onChange={setRight}
            />
            <RangeField
              label="Crop top"
              value={top}
              min={0}
              max={100}
              format={percent}
              onChange={setTop}
            />
            <RangeField
              label="Crop bottom"
              value={bottom}
              min={0}
              max={100}
              format={percent}
              onChange={setBottom}
            />
          </Step>
          <Step number={5} title="Resize and rotate" code="cv2.resize · cv2.rotate">
            <RangeField
              label="Resize"
              value={scale}
              min={0.1}
              max={3}
              step={0.1}
              format={times}
              onChange={setScale}
            />
            <SelectField
              label="Rotate 90 degrees"
              value={direction}
              options={[
                { value: "cw", label: "Clockwise" },
                { value: "ccw", label: "Counterclockwise" },
              ]}
              onChange={setDirection}
            />
          </Step>
        </>
      }
    />
  );
}

export function ImagesLab() {
  return (
    <LabProvider>
      <Lab />
    </LabProvider>
  );
}

import {
  api,
  formBody,
  imageFields,
  LabProvider,
  unwrap,
  useSamples,
  type ImageChoice,
} from "@csst106/api-client";
import {
  ColorField,
  ImageSource,
  NumberField,
  RangeField,
  SelectField,
  useRunOnce,
  Workbench,
} from "@csst106/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

const percent = (value: number) => `${value}%`;

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

  const run = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab01/run", {
          body: {
            ...imageFields(image),
            pixel_x: x,
            pixel_y: y,
            color,
            crop_left: left,
            crop_right: right,
            crop_top: top,
            crop_bottom: bottom,
            scale,
            clockwise: direction === "cw",
          },
          bodySerializer: formBody,
        }),
      ),
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
          <ImageSource samples={samples} value={image} onChange={setImage} />
          <div className="field-row">
            <NumberField label="Pixel x" value={x} min={0} placeholder="Center" onChange={setX} />
            <NumberField label="Pixel y" value={y} min={0} placeholder="Center" onChange={setY} />
          </div>
          <ColorField label="New pixel color" value={color} onChange={setColor} />
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
          <RangeField
            label="Resize"
            value={scale}
            min={0.1}
            max={3}
            step={0.1}
            format={(v) => `${v}x`}
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

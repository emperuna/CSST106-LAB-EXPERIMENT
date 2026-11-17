import {
  Button,
  CheckField,
  ColorField,
  FileField,
  ImageSource,
  NumberField,
  RangeField,
  SelectField,
  Step,
  type ImageValue,
} from "@reticle/ui";
import { useState } from "react";
import { CANNY, ORIGINAL } from "../data/sampleResult";

/** Buttons, then every field inside procedure steps, as a lab's control rail shows them. */
export function ControlsSpec() {
  const [image, setImage] = useState<ImageValue>({ sample: "original" });
  const [low, setLow] = useState(100);
  const [blur, setBlur] = useState(3);
  const [checked, setChecked] = useState(true);
  const [color, setColor] = useState("#ff0000");
  const [pixel, setPixel] = useState<number | undefined>(256);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="ds-split">
      <div className="ds-specimen">
        <span className="ds-label">Buttons</span>
        <div className="ds-row">
          <Button>Run the lab</Button>
          <Button variant="secondary">Secondary</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="ds-row">
          <Button size="small">Small</Button>
          <Button size="small" variant="secondary">
            Small secondary
          </Button>
        </div>
      </div>
      <div className="ds-specimen">
        <span className="ds-label">Control rail with steps</span>
        <div className="controls">
          <Step number={1} title="Input image">
            <ImageSource
              samples={[
                { name: "original", label: "Original image", url: ORIGINAL },
                { name: "canny", label: "Canny edges", url: CANNY },
              ]}
              value={image}
              onChange={setImage}
            />
          </Step>
          <Step number={4} title="Canny" code="cv2.Canny">
            <RangeField
              label="Low threshold"
              value={low}
              min={0}
              max={500}
              step={5}
              hint="Weak edges survive only when connected to a strong one."
              onChange={setLow}
            />
            <RangeField
              label="Disabled slider"
              value={200}
              min={0}
              max={500}
              disabled
              onChange={() => undefined}
            />
          </Step>
          <Step title="Other fields">
            <SelectField
              label="Kernel size"
              value={blur}
              options={[1, 3, 5].map((value) => ({ value, label: `${value} x ${value}` }))}
              onChange={setBlur}
            />
            <NumberField label="Pixel x" value={pixel} min={0} onChange={setPixel} />
            <ColorField label="New pixel color" value={color} onChange={setColor} />
            <CheckField
              label="Whiten"
              checked={checked}
              hint="The lab sheet turns this on."
              onChange={setChecked}
            />
            <FileField label="Second image" accept="image/*" file={file} onChange={setFile} />
          </Step>
          <Button>Run</Button>
        </div>
      </div>
    </div>
  );
}

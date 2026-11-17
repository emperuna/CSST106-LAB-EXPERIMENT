import {
  Button,
  CheckField,
  ColorField,
  FileField,
  Gauge,
  ImageSource,
  Loader,
  NumberField,
  RangeField,
  ResultView,
  SelectField,
  StatusBadge,
  Tabs,
  type ImageValue,
  type ResultData,
  ErrorMessage,
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Pause,
  Play,
  Upload,
  X,
} from "@reticle/ui";
import { useState, type ReactNode } from "react";
import CANNY from "../assets/canny.png?url";
import ORIGINAL from "../assets/original.png?url";

const ANGLES = ["0", "5", "10", "15", "30", "45", "90", "180"];
const SURF = [600, 309, 225, 190, 131, 110, 345, 302];
const USURF = [600, 307, 199, 109, 4, 0, 0, 0];

// Saved values from outputs/lab02 and outputs/lab04, so the examples show real results.
const RESULT: ResultData = {
  notes: ["Values on this page come from the saved Lab 2 and Lab 4 results."],
  panels: [
    { title: "Original", image: ORIGINAL, caption: "512 x 512 px", group: "Image frames" },
    { title: "Canny", image: CANNY, caption: "Thresholds 100 and 200", group: "Image frames" },
  ],
  charts: [
    {
      title: "Keypoints by Hessian threshold",
      kind: "line",
      x_label: "Hessian threshold",
      y_label: "Keypoints",
      series: [
        {
          label: "SURF",
          x: ["100", "200", "400", "800", "1600", "3200"],
          y: [1262, 896, 600, 381, 224, 136],
        },
      ],
    },
    {
      title: "Correct matches under rotation",
      kind: "line",
      x_label: "Rotation (degrees)",
      y_label: "Correct matches",
      series: [
        { label: "SURF", x: ANGLES, y: SURF },
        { label: "U-SURF", x: ANGLES, y: USURF },
      ],
    },
  ],
  tables: [
    {
      title: "Table",
      columns: ["Method", "Keypoints", "Correct (%)"],
      rows: [
        ["SURF", 600, 77.2],
        ["U-SURF", 600, 6.2],
        ["SIFT", 791, 97.1],
        ["ORB", 1973, 95.4],
      ],
    },
  ],
};

const ICONS = [
  ["Play", Play],
  ["Pause", Pause],
  ["ArrowRight", ArrowRight],
  ["ChevronDown", ChevronDown],
  ["Upload", Upload],
  ["X", X],
  ["CircleAlert", CircleAlert],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ds-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function Showcase() {
  const [image, setImage] = useState<ImageValue>({ sample: "original" });
  const [low, setLow] = useState(100);
  const [blur, setBlur] = useState(3);
  const [checked, setChecked] = useState(true);
  const [color, setColor] = useState("#ff0000");
  const [pixel, setPixel] = useState<number | undefined>(256);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="ds-showcase">
      <Section title="Buttons">
        <div className="ds-row">
          <Button>Run the lab</Button>
          <Button variant="secondary">Secondary</Button>
          <Button disabled>Disabled</Button>
          <Button size="small">Small</Button>
          <Button size="small" variant="secondary">
            Small secondary
          </Button>
        </div>
      </Section>

      <Section title="Icons">
        <ul className="ds-icons">
          {ICONS.map(([name, Icon]) => (
            <li key={name}>
              <Icon aria-hidden="true" />
              <code>{name}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Status">
        <div className="ds-row">
          <StatusBadge tone="success">API online</StatusBadge>
          <StatusBadge tone="danger">API offline</StatusBadge>
          <StatusBadge>Checking API</StatusBadge>
        </div>
        <ErrorMessage>That file could not be read as an image.</ErrorMessage>
      </Section>

      <div className="ds-columns">
        <Section title="Fields">
          <div className="controls">
            <ImageSource
              samples={[
                { name: "original", label: "Original image", url: ORIGINAL },
                { name: "canny", label: "Canny edges", url: CANNY },
              ]}
              value={image}
              onChange={setImage}
            />
            <RangeField
              label="Canny low threshold"
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
            <SelectField
              label="Gaussian blur"
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
          </div>
        </Section>
        <div className="ds-stack">
          <Section title="Tabs">
            <Tabs
              tabs={[
                { label: "Image", content: <p className="field-note">The first tab panel.</p> },
                { label: "Video", content: <p className="field-note">The second tab panel.</p> },
                { label: "Webcam", content: <p className="field-note">The third tab panel.</p> },
              ]}
            />
          </Section>
          <Section title="Gauge">
            <Gauge
              label="Canny edge pixels"
              value={6.16}
              max={25}
              format={(value) => `${value.toFixed(1)}%`}
            />
          </Section>
          <Section title="Loading">
            <Loader label="Running" />
          </Section>
          <Section title="Empty state">
            <p className="waiting">Choose your settings, then run.</p>
          </Section>
        </div>
      </div>

      <ResultView result={RESULT} />
    </div>
  );
}

import {
  api,
  formBody,
  imageFields,
  LabProvider,
  unwrap,
  useSamples,
  type ImageChoice,
} from "@csst106/api-client";
import { ImageSource, RangeField, Tabs, Workbench } from "@csst106/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface Settings {
  block: number;
  c: number;
  tolerance: number;
  low: number;
  high: number;
  minDistance: number;
}

// Settings that suit each sample, which also shows how much these methods depend on tuning.
const PRESETS: Record<string, Settings> = {
  "cells.png": { block: 151, c: -5, tolerance: 30, low: 50, high: 150, minDistance: 15 },
  "coins.png": { block: 101, c: -5, tolerance: 45, low: 80, high: 180, minDistance: 22 },
  "page.png": { block: 35, c: 12, tolerance: 25, low: 50, high: 150, minDistance: 15 },
};
const DEFAULTS = PRESETS["cells.png"] as Settings;

function ClassicalTab() {
  const samples = useSamples(["cells.png", "coins.png", "page.png"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "cells.png" });
  const [settings, setSettings] = useState(DEFAULTS);
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      setSettings((current) => ({ ...current, [key]: value }));

  function choose(next: ImageChoice) {
    setImage(next);
    const preset = "sample" in next ? PRESETS[next.sample] : undefined;
    if (preset) setSettings(preset);
  }

  const run = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab07/classical", {
          body: {
            ...imageFields(image),
            block: settings.block,
            c: settings.c,
            tolerance: settings.tolerance,
            low: settings.low,
            high: settings.high,
            min_distance: settings.minDistance,
          },
          bodySerializer: formBody,
        }),
      ),
  });

  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Segmenting"
      runLabel="Segment"
      emptyMessage="Run to compare the classical methods. The synthetic discs sample also gets IoU scores."
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <ImageSource samples={samples} value={image} onChange={choose} />
          <RangeField
            label="Adaptive block size"
            value={settings.block}
            min={3}
            max={301}
            step={2}
            onChange={set("block")}
            hint="Should be larger than the objects."
          />
          <RangeField
            label="Adaptive offset C"
            value={settings.c}
            min={-30}
            max={30}
            onChange={set("c")}
          />
          <RangeField
            label="Region growing tolerance"
            value={settings.tolerance}
            min={5}
            max={120}
            step={5}
            onChange={set("tolerance")}
            hint="Too low stalls; too high leaks."
          />
          <RangeField
            label="Canny low threshold"
            value={settings.low}
            min={0}
            max={500}
            step={5}
            onChange={set("low")}
          />
          <RangeField
            label="Canny high threshold"
            value={settings.high}
            min={0}
            max={500}
            step={5}
            onChange={set("high")}
          />
          <RangeField
            label="Minimum distance between seeds"
            value={settings.minDistance}
            min={3}
            max={60}
            onChange={set("minDistance")}
            hint="Too low splits one object; too high merges two."
          />
        </>
      }
    />
  );
}

function SemanticTab() {
  const samples = useSamples(["bus.jpg", "zidane.jpg", "input.jpg", "coffee.jpg"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "bus.jpg" });
  const run = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab07/semantic", {
          body: imageFields(image),
          bodySerializer: formBody,
        }),
      ),
  });
  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Running DeepLabV3"
      runLabel="Label every pixel"
      emptyMessage="Run to label each pixel. The first run also loads the model."
      error={run.error?.message}
      result={run.data}
      controls={<ImageSource samples={samples} value={image} onChange={setImage} />}
    />
  );
}

export function SegmentationLab() {
  return (
    <LabProvider>
      <Tabs
        tabs={[
          { label: "Classical methods", content: <ClassicalTab /> },
          { label: "Semantic", content: <SemanticTab /> },
        ]}
      />
    </LabProvider>
  );
}

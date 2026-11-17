import { useSamples, type ImageChoice } from "@csst106/api-client";
import { ImageSource, RangeField, Workbench } from "@reticle/ui";
import { useState } from "react";
import { useClassicalRun } from "../hooks/useClassicalRun";
import { DEFAULTS, PRESETS, type Settings } from "../utils/presets";

export function ClassicalTab() {
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

  const run = useClassicalRun(image, settings);

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

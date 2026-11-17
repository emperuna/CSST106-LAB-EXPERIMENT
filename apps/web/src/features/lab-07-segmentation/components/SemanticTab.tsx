import { useSamples, type ImageChoice } from "@csst106/api-client";
import { ImageSource, Step, Workbench } from "@reticle/ui";
import { useState } from "react";
import { useSemanticRun } from "../hooks/useSemanticRun";

export function SemanticTab() {
  const samples = useSamples(["bus.jpg", "zidane.jpg", "input.jpg", "coffee.jpg"]);
  const [image, setImage] = useState<ImageChoice>({ sample: "bus.jpg" });
  const run = useSemanticRun(image);
  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Running DeepLabV3"
      runLabel="Label every pixel"
      emptyMessage="Run to label each pixel. The first run also loads the model."
      error={run.error?.message}
      result={run.data}
      controls={
        <Step number={4} title="DeepLabV3 per-pixel classes" code="deeplabv3_mobilenet_v3_large">
          <ImageSource samples={samples} value={image} onChange={setImage} />
        </Step>
      }
    />
  );
}

import { LabProvider } from "@csst106/api-client";
import { Tabs } from "@reticle/ui";
import { ImageTab } from "./ImageTab";
import { TrainingTab } from "./TrainingTab";
import { VideoTab } from "./VideoTab";
import { WebcamTab } from "./WebcamTab";

export function YoloLab() {
  return (
    <LabProvider>
      <Tabs
        tabs={[
          { label: "Image", content: <ImageTab /> },
          { label: "Video", content: <VideoTab /> },
          { label: "Webcam", content: <WebcamTab /> },
          { label: "Custom training", content: <TrainingTab /> },
        ]}
      />
    </LabProvider>
  );
}

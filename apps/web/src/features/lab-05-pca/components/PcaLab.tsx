import { LabProvider } from "@csst106/api-client";
import { Tabs } from "@reticle/ui";
import { RecognizeTab } from "./RecognizeTab";
import { TrainTab } from "./TrainTab";

export function PcaLab() {
  return (
    <LabProvider>
      <Tabs
        tabs={[
          { label: "Train and evaluate", content: <TrainTab /> },
          { label: "Try a face", content: <RecognizeTab /> },
        ]}
      />
    </LabProvider>
  );
}

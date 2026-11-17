import { LabProvider } from "@csst106/api-client";
import { Tabs } from "@reticle/ui";
import { ClassicalTab } from "./ClassicalTab";
import { SemanticTab } from "./SemanticTab";

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

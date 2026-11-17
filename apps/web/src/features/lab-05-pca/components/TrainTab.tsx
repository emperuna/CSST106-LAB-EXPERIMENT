import { CheckField, RangeField, SelectField, Step, Workbench } from "@reticle/ui";
import { useState } from "react";
import { usePcaTrain } from "../hooks/usePcaTrain";

export function TrainTab() {
  const [components, setComponents] = useState(150);
  const [whiten, setWhiten] = useState(true);
  const [c, setC] = useState(1);
  const [gamma, setGamma] = useState("scale");

  const run = usePcaTrain({ components, whiten, c, gamma });

  return (
    <Workbench
      onRun={() => run.mutate()}
      running={run.isPending}
      pendingLabel="Training"
      runLabel="Fit PCA and train SVM"
      emptyMessage="Run to fit PCA and the SVM. The first run also loads the dataset."
      error={run.error?.message}
      result={run.data}
      controls={
        <>
          <Step number={2} title="Fit PCA" code='PCA(svd_solver="randomized")'>
            <RangeField
              label="PCA components"
              value={components}
              min={12}
              max={500}
              onChange={setComponents}
              hint="The lab sheet uses 150."
            />
            <CheckField
              label="Whiten"
              checked={whiten}
              onChange={setWhiten}
              hint="The lab sheet turns this on."
            />
          </Step>
          <Step
            number={4}
            title="Train the RBF SVM"
            code='SVC(kernel="rbf", class_weight="balanced")'
          >
            <SelectField
              label="SVM C"
              value={c}
              options={[1, 10, 100, 1000, 10000].map((value) => ({
                value,
                label: value.toLocaleString("en-US"),
              }))}
              onChange={setC}
            />
            <SelectField
              label="SVM gamma"
              value={gamma}
              options={["scale", "0.0005", "0.001", "0.005", "0.01"].map((value) => ({
                value,
                label: value,
              }))}
              onChange={setGamma}
              hint="The tuned model found by cross-validation uses C = 1 and gamma = 0.005."
            />
          </Step>
        </>
      }
    />
  );
}

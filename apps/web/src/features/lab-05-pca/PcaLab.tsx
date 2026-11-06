import { api, formBody, LabProvider, unwrap } from "@csst106/api-client";
import {
  CheckField,
  FileField,
  RangeField,
  ResultView,
  SelectField,
  Tabs,
  Workbench,
} from "@csst106/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

const TEST_IMAGES = 258;

function TrainTab() {
  const [components, setComponents] = useState(150);
  const [whiten, setWhiten] = useState(true);
  const [c, setC] = useState(1);
  const [gamma, setGamma] = useState("scale");

  const run = useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab05/train", {
          body: { n_components: components, whiten, c, gamma },
          bodySerializer: formBody,
        }),
      ),
  });

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
        </>
      }
    />
  );
}

function RecognizeTab() {
  const [file, setFile] = useState<File | null>(null);
  const run = useMutation({
    mutationFn: (testIndex?: number) =>
      unwrap(
        api.POST("/api/labs/lab05/recognize", {
          body:
            testIndex === undefined
              ? { image: file as unknown as string }
              : { test_index: testIndex },
          bodySerializer: formBody,
        }),
      ),
  });
  return (
    <div className="workbench">
      <div className="controls">
        <p className="field-note">
          Uses the saved tuned model: 150 components, C = 1, gamma = 0.005.
        </p>
        <button
          type="button"
          className="button"
          disabled={run.isPending}
          onClick={() => run.mutate(Math.floor(Math.random() * TEST_IMAGES))}
        >
          Try a random test face
        </button>
        <FileField
          label="Or fit your own photo"
          accept="image/*"
          file={file}
          onChange={setFile}
          hint="The model only knows seven people, so this finds the closest fit and does not identify anyone."
        />
        <button
          type="button"
          className="button-secondary"
          disabled={!file || run.isPending}
          onClick={() => run.mutate(undefined)}
        >
          Fit uploaded photo
        </button>
      </div>
      <div className="output" aria-live="polite" aria-busy={run.isPending}>
        {run.error && (
          <p className="error" role="alert">
            {run.error.message}
          </p>
        )}
        {run.data ? (
          <ResultView result={run.data} />
        ) : (
          !run.error && (
            <p className="waiting">
              {run.isPending ? "Working…" : "Pick a test face or upload a photo."}
            </p>
          )
        )}
      </div>
    </div>
  );
}

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

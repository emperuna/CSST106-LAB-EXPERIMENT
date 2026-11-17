import { ErrorMessage, FileField, ResultView } from "@reticle/ui";
import { useState } from "react";
import { usePcaRecognize } from "../hooks/usePcaRecognize";

// Size of the saved test split, so a random index always names a real test face.
const TEST_IMAGES = 258;

export function RecognizeTab() {
  const [file, setFile] = useState<File | null>(null);
  const run = usePcaRecognize(file);
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
          className="button button-secondary"
          disabled={!file || run.isPending}
          onClick={() => run.mutate(undefined)}
        >
          Fit uploaded photo
        </button>
      </div>
      <div className="output" aria-live="polite" aria-busy={run.isPending}>
        {run.error && <ErrorMessage>{run.error.message}</ErrorMessage>}
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

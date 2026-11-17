import { Play } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { ErrorMessage } from "../error-message/ErrorMessage";
import { Loader } from "../loader/Loader";
import { ResultView, type ResultData } from "../result-view/ResultView";

interface Props {
  controls: ReactNode;
  onRun: () => void;
  running: boolean;
  error?: string | null;
  result?: ResultData | null;
  runLabel?: string;
  pendingLabel?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

/** The layout each lab shares: inputs on one side, results on the other. */
export function Workbench({
  controls,
  onRun,
  running,
  error,
  result,
  runLabel = "Run",
  pendingLabel = "Running",
  emptyMessage = "Choose your settings, then run.",
  disabled,
}: Props) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onRun();
  }
  return (
    <div className="workbench">
      <form className="controls" onSubmit={submit}>
        {controls}
        <button type="submit" className="button" disabled={running || disabled}>
          {!running && <Play aria-hidden="true" />}
          {running ? `${pendingLabel}…` : runLabel}
        </button>
      </form>
      <div className="output" aria-live="polite" aria-busy={running}>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {running && !result && <Loader label={pendingLabel} />}
        {!running && !result && !error && <p className="waiting">{emptyMessage}</p>}
        {result && (
          <div className={running ? "is-stale" : undefined}>
            <ResultView result={result} />
          </div>
        )}
      </div>
    </div>
  );
}

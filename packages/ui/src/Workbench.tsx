import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { ResultView, type ResultData } from "./ResultView";

/** Run a callback once after the first render, using its first version. */
export function useRunOnce(callback: () => void) {
  const first = useRef(callback);
  useEffect(() => first.current(), []);
}

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
          {running ? `${pendingLabel}…` : runLabel}
        </button>
      </form>
      <div className="output" aria-live="polite" aria-busy={running}>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {running && !result && <p className="waiting">{pendingLabel}…</p>}
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

import { ResultView } from "@reticle/ui";
import { RESULT } from "../data/sampleResult";

/** A whole result as a lab returns it: readouts, viewer and filmstrip, charts and a table. */
export function ResultsSpec() {
  return <ResultView result={RESULT} />;
}

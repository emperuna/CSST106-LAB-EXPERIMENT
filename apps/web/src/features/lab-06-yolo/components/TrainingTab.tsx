import { ErrorMessage, ResultView } from "@reticle/ui";
import { useTrainingResults } from "../hooks/useTrainingResults";

export function TrainingTab() {
  const { data, error, isPending } = useTrainingResults();
  if (isPending) return <p className="waiting">Loading saved results…</p>;
  if (error) {
    return <ErrorMessage>{error.message}</ErrorMessage>;
  }
  return <ResultView result={data} />;
}

import { api, unwrap } from "@csst106/api-client";
import { useQuery } from "@tanstack/react-query";

/** Loads the saved custom-training results; training itself stays out of the Web UI. */
export function useTrainingResults() {
  return useQuery({
    queryKey: ["lab06-training"],
    queryFn: () => unwrap(api.GET("/api/labs/lab06/training")),
  });
}

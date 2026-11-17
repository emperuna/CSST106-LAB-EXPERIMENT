import { api, formBody, unwrap } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";

export interface PcaTrainSettings {
  components: number;
  whiten: boolean;
  c: number;
  gamma: string;
}

/** Fits PCA (eigenfaces) and trains the SVM with the chosen settings. */
export function usePcaTrain({ components, whiten, c, gamma }: PcaTrainSettings) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab05/train", {
          body: { n_components: components, whiten, c, gamma },
          bodySerializer: formBody,
        }),
      ),
  });
}

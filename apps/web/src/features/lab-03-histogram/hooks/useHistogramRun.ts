import { api, formBody, imageFields, unwrap, type ImageChoice } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";

export interface HistogramSettings {
  image: ImageChoice;
  clip: number;
  grid: number;
  low: number;
  high: number;
}

/** Runs Lab 3 (histogram equalization, CLAHE and contrast stretching) with the current settings. */
export function useHistogramRun({ image, clip, grid, low, high }: HistogramSettings) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab03/run", {
          body: { ...imageFields(image), clip_limit: clip, grid, low_pct: low, high_pct: high },
          bodySerializer: formBody,
        }),
      ),
  });
}

import { api, formBody, imageFields, unwrap, type ImageChoice } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";
import type { Settings } from "../utils/presets";

/** Runs the classical segmentation methods (thresholds, region growing, edges, watershed). */
export function useClassicalRun(image: ImageChoice, settings: Settings) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab07/classical", {
          body: {
            ...imageFields(image),
            block: settings.block,
            c: settings.c,
            tolerance: settings.tolerance,
            low: settings.low,
            high: settings.high,
            min_distance: settings.minDistance,
          },
          bodySerializer: formBody,
        }),
      ),
  });
}

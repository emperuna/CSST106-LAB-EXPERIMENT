import { api, formBody, imageFields, unwrap, type ImageChoice } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";

export interface FeaturesSettings {
  image: ImageChoice;
  second: File | null;
  threshold: number;
  degrees: number;
  scale: number;
  sweeps: boolean;
}

/** Runs Lab 4 (SURF, U-SURF, SIFT and ORB detection and matching) with the current settings. */
export function useFeaturesRun(settings: FeaturesSettings) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab04/run", {
          body: {
            ...imageFields(settings.image),
            second_image: (settings.second ?? undefined) as unknown as string | undefined,
            threshold: settings.threshold,
            degrees: settings.degrees,
            scale: settings.scale,
            include_sweeps: settings.sweeps,
          },
          bodySerializer: formBody,
        }),
      ),
  });
}

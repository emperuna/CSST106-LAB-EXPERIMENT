import { api, formBody, imageFields, unwrap, type ImageChoice } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";

export interface EdgesSettings {
  image: ImageChoice;
  blur: number;
  sobelSize: number;
  low: number;
  high: number;
}

/** Runs Lab 2 (Gaussian blur, Sobel and Canny) with the current settings. */
export function useEdgesRun({ image, blur, sobelSize, low, high }: EdgesSettings) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab02/run", {
          body: { ...imageFields(image), blur, sobel_size: sobelSize, low, high },
          bodySerializer: formBody,
        }),
      ),
  });
}

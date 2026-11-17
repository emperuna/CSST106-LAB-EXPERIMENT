import { api, formBody, imageFields, unwrap, type ImageChoice } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";
import type { ModelName } from "../utils/models";

export interface DetectSettings {
  image: ImageChoice;
  model: ModelName;
  conf: number;
  imgsz: number;
}

/** Runs YOLO object detection on one image. */
export function useDetect({ image, model, conf, imgsz }: DetectSettings) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab06/detect", {
          body: { ...imageFields(image), model, conf, imgsz },
          bodySerializer: formBody,
        }),
      ),
  });
}

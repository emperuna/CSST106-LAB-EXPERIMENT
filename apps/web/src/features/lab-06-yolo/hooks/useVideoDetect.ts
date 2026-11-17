import { api, formBody, unwrap } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";
import type { ModelName } from "../utils/models";

export interface VideoDetectSettings {
  file: File | null;
  model: ModelName;
  conf: number;
}

/** Runs YOLO on evenly spaced frames of an uploaded video, at 320 px to keep it quick. */
export function useVideoDetect({ file, model, conf }: VideoDetectSettings) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab06/video", {
          body: { file: file as unknown as string, model, conf, imgsz: 320 },
          bodySerializer: formBody,
        }),
      ),
  });
}

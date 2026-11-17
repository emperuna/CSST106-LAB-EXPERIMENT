import { api, formBody, imageFields, unwrap, type ImageChoice } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";

export interface ImagesSettings {
  image: ImageChoice;
  x?: number;
  y?: number;
  color: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  scale: number;
  direction: "cw" | "ccw";
}

/** Runs Lab 1 (pixel access, crop, resize and rotate) with the current settings. */
export function useImagesRun(settings: ImagesSettings) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab01/run", {
          body: {
            ...imageFields(settings.image),
            pixel_x: settings.x,
            pixel_y: settings.y,
            color: settings.color,
            crop_left: settings.left,
            crop_right: settings.right,
            crop_top: settings.top,
            crop_bottom: settings.bottom,
            scale: settings.scale,
            clockwise: settings.direction === "cw",
          },
          bodySerializer: formBody,
        }),
      ),
  });
}

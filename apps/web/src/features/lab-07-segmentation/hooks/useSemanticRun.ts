import { api, formBody, imageFields, unwrap, type ImageChoice } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";

/** Labels every pixel with DeepLabV3. */
export function useSemanticRun(image: ImageChoice) {
  return useMutation({
    mutationFn: () =>
      unwrap(
        api.POST("/api/labs/lab07/semantic", {
          body: imageFields(image),
          bodySerializer: formBody,
        }),
      ),
  });
}

import { api, formBody, unwrap } from "@csst106/api-client";
import { useMutation } from "@tanstack/react-query";

/**
 * Fits a face with the saved tuned model. Pass a test index to use a face from the test split;
 * pass nothing to use the uploaded file.
 */
export function usePcaRecognize(file: File | null) {
  return useMutation({
    mutationFn: (testIndex?: number) =>
      unwrap(
        api.POST("/api/labs/lab05/recognize", {
          body:
            testIndex === undefined
              ? { image: file as unknown as string }
              : { test_index: testIndex },
          bodySerializer: formBody,
        }),
      ),
  });
}

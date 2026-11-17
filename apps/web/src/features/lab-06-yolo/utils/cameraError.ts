/** A plain-language message for a getUserMedia failure. */
export function cameraError(error: unknown): string {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError")
    return "Camera permission was denied. Allow it in your browser, then try again.";
  if (name === "NotFoundError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is being used by another app.";
  return error instanceof Error ? error.message : "The camera could not be started.";
}

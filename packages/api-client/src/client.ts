import createClient from "openapi-fetch";
import type { paths } from "./schema";

const baseUrl = import.meta.env?.PUBLIC_API_URL ?? "http://localhost:8000";

/** Typed API client; its types are generated from the backend with `pnpm gen:api`. */
export const api = createClient<paths>({ baseUrl });

export function sampleUrl(name: string): string {
  return `${baseUrl}/api/samples/${encodeURIComponent(name)}`;
}

/** What the user picked as input: one of the sample images or their own file. */
export type ImageChoice = { sample: string } | { file: File };

/**
 * Form fields for an image choice. The generated types describe uploads as strings
 * because that is how OpenAPI writes binary fields; formBody sends the real File.
 */
export function imageFields(choice: ImageChoice): { sample?: string; image?: string } {
  return "file" in choice ? { image: choice.file as unknown as string } : { sample: choice.sample };
}

/** Serializer for multipart endpoints; skips unset fields so server defaults apply. */
export function formBody(body: unknown): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    form.append(key, value instanceof Blob ? value : String(value));
  }
  return form;
}

function describeError(error: unknown, status: number): string {
  const detail = (error as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map(
        (item: { loc?: unknown[]; msg?: string }) => `${item.loc?.at(-1) ?? "input"}: ${item.msg}`,
      )
      .join("; ");
  }
  return `The server returned an error (${status}).`;
}

/** Return the response data, or throw an Error whose message is safe to show the user. */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result: { data?: T; error?: unknown; response: Response };
  try {
    result = await request;
  } catch {
    throw new Error("Could not reach the API. Check that it is running with: pnpm dev:api");
  }
  if (result.data === undefined)
    throw new Error(describeError(result.error, result.response.status));
  return result.data;
}

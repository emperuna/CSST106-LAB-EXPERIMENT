import { useQuery } from "@tanstack/react-query";
import { api, sampleUrl, unwrap } from "./client";

export function useSamples(only?: string[]) {
  const { data } = useQuery({
    queryKey: ["samples"],
    queryFn: () => unwrap(api.GET("/api/samples")),
  });
  return (data ?? [])
    .filter((sample) => !only || only.includes(sample.name))
    .map((sample) => ({ ...sample, url: sampleUrl(sample.name) }));
}

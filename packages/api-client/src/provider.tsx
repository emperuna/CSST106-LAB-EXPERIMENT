import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * One query client per browser page. Astro islands are separate React roots and don't
 * share context, so every island wraps itself in LabProvider, which reuses this object.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60_000 }, mutations: { retry: 0 } },
});

export function LabProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

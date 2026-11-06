import { api } from "@csst106/api-client";
import { useQuery } from "@tanstack/react-query";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/health");
      if (error || !data) throw new Error("The API did not respond");
      return data;
    },
  });
}

import { useQuery } from "@tanstack/react-query";

const BASE_URL = "https://node.hivoco.com";

interface BrandResponse {
  id: number;
  name: string;
}

export function useBrands() {
  return useQuery<BrandResponse[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/api/dashboard/brands`);
      if (!res.ok) throw new Error("Failed to fetch brands");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

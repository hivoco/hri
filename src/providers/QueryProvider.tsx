import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { triggerWeightRollback } from "@/lib/weight-rollback";

const WEIGHT_QUERY_KEYS = new Set(["summary", "scores", "themes", "budget", "brand-view"]);

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      const key = query.queryKey[0];
      if (typeof key === "string" && WEIGHT_QUERY_KEYS.has(key)) {
        triggerWeightRollback();
        toast.error("Weight update failed", {
          description: "Reverted to previous weights. Please try again.",
        });
      }
    },
  }),
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

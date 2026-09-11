import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./lib/trpc.js";
import { getToken } from "./lib/session.js";
import { ToastProvider } from "./components/Toast.js";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({
        url: "/trpc",
        transformer: superjson,
        headers: () => {
          const token = getToken();
          return token ? { "x-session-token": token } : {};
        },
      })],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

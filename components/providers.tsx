"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * Data is considered fresh for 60 seconds by default.
         * Individual query hooks may override this (e.g. documents use 0).
         */
        staleTime: 60_000,
        /**
         * Only retry failed requests once to avoid hammering the server on
         * hard errors (auth failures, 404s, etc.).
         */
        retry: 1,
        /**
         * Don't re-fetch just because the user switches browser tabs —
         * reduces unnecessary network traffic.
         */
        refetchOnWindowFocus: false,
      },
    },
  });
}

// Singleton on the server; fresh instance on every client mount
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return makeQueryClient();
  }
  // Browser: reuse the same client for the lifetime of the page
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures the client is NOT re-created on every render
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}

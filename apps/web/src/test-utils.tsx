import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

export function renderWithQueryClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

export const mockAuthValue = {
  token: "test-token",
  user: null,
  isAuthenticated: true,
  isLoading: false,
  setSession: () => {},
  logout: () => {}
};

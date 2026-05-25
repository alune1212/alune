import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";

export function renderWithQueryClient(children: ReactNode): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

export function paginatedResponse<T>(items: T[], pageSize = 10) {
  return {
    success: true as const,
    data: { items, page: 1, page_size: pageSize, total: items.length },
    message: "ok",
    error: null
  };
}

export function successResponse<T>(data: T) {
  return {
    success: true as const,
    data,
    message: "ok",
    error: null
  };
}

export const mockAuthValue = {
  token: "test-token",
  user: null,
  isAuthenticated: true,
  isLoading: false,
  isSessionExpired: false,
  setSession: () => {},
  logout: () => {},
  clearExpiredFlag: () => {}
};

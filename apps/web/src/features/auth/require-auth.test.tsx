import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RequireAuth } from "@/features/auth/require-auth";

const navigateMock = vi.fn((props: { to: string; search?: unknown }) => (
  <div data-testid="navigate" data-to={props.to} data-search={JSON.stringify(props.search ?? {})} />
));

let authState = {
  isAuthenticated: false,
  isLoading: false,
  isSessionExpired: false,
};

vi.mock("@tanstack/react-router", () => ({
  Navigate: (props: { to: string; search?: unknown }) => navigateMock(props),
}));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => authState,
}));

describe("RequireAuth", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    authState = {
      isAuthenticated: false,
      isLoading: false,
      isSessionExpired: false,
    };
  });

  it("redirects expired sessions to login with an expired marker", () => {
    authState = {
      isAuthenticated: false,
      isLoading: false,
      isSessionExpired: true,
    };

    render(
      <RequireAuth>
        <div>Protected content</div>
      </RequireAuth>,
    );

    expect(screen.getByTestId("navigate").getAttribute("data-to")).toBe("/login");
    expect(screen.getByTestId("navigate").getAttribute("data-search")).toBe("{\"expired\":true}");
  });
});

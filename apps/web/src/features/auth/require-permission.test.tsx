import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RequirePermission } from "@/features/auth/require-permission";

let authState = {
  isAuthenticated: true,
  user: {
    is_superuser: false,
    permissions: [] as string[],
  },
};

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => authState,
}));

describe("RequirePermission", () => {
  beforeEach(() => {
    cleanup();
    authState = {
      isAuthenticated: true,
      user: {
        is_superuser: false,
        permissions: [],
      },
    };
  });

  it("renders children for a superuser", () => {
    authState.user.is_superuser = true;

    render(<RequirePermission permission="action:users:read">Allowed</RequirePermission>);

    expect(screen.getByText("Allowed")).toBeTruthy();
  });

  it("renders children when the user has the required permission", () => {
    authState.user.permissions = ["action:users:read"];

    render(<RequirePermission permission="action:users:read">Allowed</RequirePermission>);

    expect(screen.getByText("Allowed")).toBeTruthy();
  });

  it("renders fallback when permission is missing", () => {
    render(
      <RequirePermission permission="action:users:read" fallback={<span>Denied</span>}>
        Allowed
      </RequirePermission>,
    );

    expect(screen.queryByText("Allowed")).toBeNull();
    expect(screen.getByText("Denied")).toBeTruthy();
  });
});

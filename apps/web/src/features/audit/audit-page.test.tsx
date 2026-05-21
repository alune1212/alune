import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuditPage } from "@/features/audit/audit-page";
import { mockAuthValue, paginatedResponse, renderWithQueryClient } from "@/test-utils";
import {
  exportOperationLogs,
  type LoginLogPublic,
  type OperationLogPublic
} from "@alune/api-client";
import {
  useGetLoginLogsApiV1AuditLoginLogsGet,
  useGetOperationLogsApiV1AuditOperationLogsGet
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue
}));

vi.mock("@alune/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@alune/api-client")>();
  return {
    ...actual,
    exportOperationLogs: vi.fn()
  };
});

vi.mock("@alune/api-client/generated", () => ({
  useGetLoginLogsApiV1AuditLoginLogsGet: vi.fn(),
  useGetOperationLogsApiV1AuditOperationLogsGet: vi.fn()
}));

const operationLogs: OperationLogPublic[] = [
  {
    id: "operation-1",
    actor_user_id: "user-1",
    action: "upload",
    resource: "file_attachment",
    resource_id: "file-1",
    ip_address: null,
    user_agent: null,
    status: "success",
    detail: "Uploaded file"
  }
];

const loginLogs: LoginLogPublic[] = [
  {
    id: "login-1",
    username: "admin",
    user_id: "user-1",
    ip_address: "127.0.0.1",
    user_agent: null,
    status: "success",
    message: "Signed in"
  }
];

describe("AuditPage", () => {
  beforeEach(() => {
    vi.mocked(useGetOperationLogsApiV1AuditOperationLogsGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(operationLogs) },
      isError: false
    } as ReturnType<typeof useGetOperationLogsApiV1AuditOperationLogsGet>);
    vi.mocked(useGetLoginLogsApiV1AuditLoginLogsGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(loginLogs) },
      isError: false
    } as ReturnType<typeof useGetLoginLogsApiV1AuditLoginLogsGet>);
    vi.mocked(exportOperationLogs).mockResolvedValue(new Blob(["csv"], { type: "text/csv" }));
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:operation-logs");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("exports operation logs using the current filters", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<AuditPage />);

    await screen.findByText("Uploaded file");
    await user.type(screen.getByPlaceholderText("Search action, resource, or detail"), "upload");
    await user.type(screen.getAllByPlaceholderText("Status")[0]!, "success");
    await user.click(screen.getAllByRole("button", { name: "Export" })[0]!);

    await waitFor(() => {
      expect(exportOperationLogs).toHaveBeenCalledWith("test-token", {
        q: "upload",
        status: "success",
        startedAt: undefined,
        endedAt: undefined
      });
    });
  });
});

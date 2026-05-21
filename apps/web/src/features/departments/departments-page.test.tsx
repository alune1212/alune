import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DepartmentsPage } from "@/features/departments/departments-page";
import { mockAuthValue, paginatedResponse, renderWithQueryClient, successResponse } from "@/test-utils";
import {
  createDepartment,
  type DepartmentPublic,
  type DepartmentTreeNode
} from "@alune/api-client";
import {
  useGetDepartmentsApiV1DepartmentsGet,
  useGetDepartmentTreeApiV1DepartmentsTreeGet
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue
}));

vi.mock("@alune/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@alune/api-client")>();
  return {
    ...actual,
    createDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
    updateDepartment: vi.fn()
  };
});

vi.mock("@alune/api-client/generated", () => ({
  useGetDepartmentsApiV1DepartmentsGet: vi.fn(),
  useGetDepartmentTreeApiV1DepartmentsTreeGet: vi.fn()
}));

const departments: DepartmentPublic[] = [
  {
    id: "dept-hr",
    code: "HR",
    name: "Human Resources",
    parent_id: null,
    description: "People team",
    sort_order: 1,
    is_active: true
  }
];

const departmentTree: DepartmentTreeNode[] = [
  {
    ...departments[0]!,
    children: [
      {
        id: "dept-recruiting",
        code: "REC",
        name: "Recruiting",
        parent_id: "dept-hr",
        description: null,
        sort_order: 2,
        is_active: true,
        children: []
      }
    ]
  }
];

describe("DepartmentsPage", () => {
  beforeEach(() => {
    vi.mocked(useGetDepartmentsApiV1DepartmentsGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(departments) },
      isError: false
    } as ReturnType<typeof useGetDepartmentsApiV1DepartmentsGet>);
    vi.mocked(useGetDepartmentTreeApiV1DepartmentsTreeGet).mockReturnValue({
      data: { status: 200, data: successResponse(departmentTree) },
      isError: false
    } as ReturnType<typeof useGetDepartmentTreeApiV1DepartmentsTreeGet>);
    vi.mocked(createDepartment).mockResolvedValue(successResponse(departments[0]!));
  });

  it("shows the department tree and creates a department", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<DepartmentsPage />);

    expect(await screen.findAllByText("Human Resources")).not.toHaveLength(0);
    expect(screen.getByText("Recruiting")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Code"), "FIN");
    await user.type(screen.getByPlaceholderText("Name"), "Finance");
    await user.type(screen.getByPlaceholderText("Description"), "Finance team");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createDepartment).toHaveBeenCalledWith("test-token", {
        code: "FIN",
        name: "Finance",
        description: "Finance team"
      });
    });
  });
});

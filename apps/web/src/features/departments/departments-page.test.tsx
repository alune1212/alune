import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DepartmentsPage } from "@/features/departments/departments-page";
import {
  mockAuthValue,
  paginatedResponse,
  renderWithQueryClient,
  successResponse,
} from "@/test-utils";
import {
  type DepartmentPublic,
  type DepartmentTreeNode,
} from "@alune/api-client/generated";
import {
  useCreateDepartmentApiV1DepartmentsPost,
  useDeleteDepartmentApiV1DepartmentsDepartmentIdDelete,
  useGetDepartmentsApiV1DepartmentsGet,
  useGetDepartmentTreeApiV1DepartmentsTreeGet,
  useUpdateDepartmentApiV1DepartmentsDepartmentIdPatch,
} from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue,
}));

vi.mock("@alune/api-client/generated", () => ({
  useCreateDepartmentApiV1DepartmentsPost: vi.fn(),
  useDeleteDepartmentApiV1DepartmentsDepartmentIdDelete: vi.fn(),
  useGetDepartmentsApiV1DepartmentsGet: vi.fn(),
  useGetDepartmentTreeApiV1DepartmentsTreeGet: vi.fn(),
  useUpdateDepartmentApiV1DepartmentsDepartmentIdPatch: vi.fn(),
}));

const departments: DepartmentPublic[] = [
  {
    id: "dept-hr",
    code: "HR",
    name: "Human Resources",
    parent_id: null,
    description: "People team",
    sort_order: 1,
    is_active: true,
  },
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
        children: [],
      },
    ],
  },
];
const createDepartmentMutate = vi.fn();

describe("DepartmentsPage", () => {
  beforeEach(() => {
    createDepartmentMutate.mockReset();
    vi.mocked(useGetDepartmentsApiV1DepartmentsGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(departments) },
      isError: false,
    } as unknown as ReturnType<typeof useGetDepartmentsApiV1DepartmentsGet>);
    vi.mocked(useGetDepartmentTreeApiV1DepartmentsTreeGet).mockReturnValue({
      data: { status: 200, data: successResponse(departmentTree) },
      isError: false,
    } as unknown as ReturnType<
      typeof useGetDepartmentTreeApiV1DepartmentsTreeGet
    >);
    vi.mocked(useCreateDepartmentApiV1DepartmentsPost).mockReturnValue({
      mutate: createDepartmentMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateDepartmentApiV1DepartmentsPost>);
    vi.mocked(
      useDeleteDepartmentApiV1DepartmentsDepartmentIdDelete,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useDeleteDepartmentApiV1DepartmentsDepartmentIdDelete
    >);
    vi.mocked(
      useUpdateDepartmentApiV1DepartmentsDepartmentIdPatch,
    ).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<
      typeof useUpdateDepartmentApiV1DepartmentsDepartmentIdPatch
    >);
  });

  it("shows the department tree and creates a department", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<DepartmentsPage />);

    expect(await screen.findAllByText("Human Resources")).not.toHaveLength(0);
    expect(screen.getByText("Recruiting")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("编码"), "FIN");
    await user.type(screen.getByPlaceholderText("名称"), "Finance");
    await user.type(screen.getByPlaceholderText("描述"), "Finance team");
    await user.click(screen.getByRole("button", { name: "创建" }));

    await waitFor(() => {
      expect(createDepartmentMutate).toHaveBeenCalledWith({
        data: {
          code: "FIN",
          name: "Finance",
          description: "Finance team",
        },
      });
    });
  });
});
